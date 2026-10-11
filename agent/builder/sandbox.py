"""Opens a short-lived Daytona sandbox and clones the user's repo into it."""

import os
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path

from agent.builder.github_app import github_json
from agent.project import Project
from agent.source import BLOCKED_NAMES, SKIP_DIRS, TEXT_SUFFIXES

REPO_DIR = "repo"
SANDBOX_LIMIT = 2
WAIT_MESSAGE = "Too much demand right now. Please wait a little and try again."
_IDLE = {
    "stopped",
    "archived",
    "destroyed",
    "deleted",
    "error",
    "build_failed",
}


@dataclass
class RepoSandbox:
    sandbox: object
    path: str
    _temp: tempfile.TemporaryDirectory[str] | None = None

    def materialize(self, project: Project) -> Path:
        """Copy the project's source files out of the sandbox for the model to read."""
        self._temp = tempfile.TemporaryDirectory(prefix="ff-repo-")
        root = Path(self._temp.name)
        folder = project.source_folder.strip().replace("\\", "/").strip("/")
        remote = self.path if folder in {"", "."} else f"{self.path}/{folder}"
        listing = self._exec(
            "find . -type d \\( -name .git -o -name node_modules -o -name .next "
            "-o -name venv -o -name .venv -o -name dist -o -name build "
            "-o -name __pycache__ \\) -prune -o -type f -print",
            remote,
        )
        copied = 0
        for line in listing.splitlines():
            rel = line.strip().removeprefix("./")
            if (
                not rel
                or rel.startswith(".git/")
                or "/" in rel
                and any(part in SKIP_DIRS for part in Path(rel).parts)
            ):
                continue
            path = Path(rel)
            if path.name in BLOCKED_NAMES or path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            payload = self.sandbox.fs.download_file(f"{remote}/{rel}")
            if not isinstance(payload, (bytes, bytearray)):
                continue
            dest_rel = rel if folder in {"", "."} else f"{folder}/{rel}"
            dest = root / dest_rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(payload)
            copied += 1
        if copied == 0:
            label = "the repository root" if folder in {"", "."} else folder + "/"
            raise RuntimeError(f"{label} has no source files to edit.")
        return root

    def publish(
        self, repo: Path, files: list[Path], title: str, body: str, token: str
    ) -> str:
        """Upload the edited files, commit them on a new branch, and push that branch."""
        relative = [path.relative_to(repo).as_posix() for path in files]
        for path, name in zip(files, relative):
            self.sandbox.fs.upload_file(path.read_bytes(), f"{self.path}/{name}")
        branch = self._fresh_branch(_slug(title))
        self.sandbox.git.create_branch(self.path, branch)
        self.sandbox.git.checkout_branch(self.path, branch)
        self.sandbox.git.add(self.path, relative)
        self.sandbox.git.commit(
            self.path,
            f"{title}\n\n{body}",
            "Friction Fixer",
            "friction-fixer@users.noreply.github.com",
        )
        self.sandbox.git.push(
            self.path,
            username="x-access-token",
            password=token,
            set_upstream=True,
        )
        return branch

    def undo(
        self, url: str, reason: str, token: str, repository: str, base: str
    ) -> str:
        """Revert a merged pull request inside this clone and push the undo branch."""
        from agent.builder import git

        number = _pull_number(url)
        pull = github_json("GET", f"/repos/{repository}/pulls/{number}", token)
        sha = pull.get("merge_commit_sha")
        if not isinstance(sha, str) or not re.fullmatch(r"[0-9a-fA-F]{7,40}", sha):
            raise RuntimeError("The pull request has no merge commit to undo.")
        branch = self._fresh_branch(f"undo/{number}")
        self.sandbox.git.checkout_branch(self.path, base)
        self.sandbox.git.pull(self.path, username="x-access-token", password=token)
        self.sandbox.git.create_branch(self.path, branch)
        self.sandbox.git.checkout_branch(self.path, branch)
        self.sandbox.git.configure_user(
            "Friction Fixer",
            "friction-fixer@users.noreply.github.com",
            scope="local",
            path=self.path,
        )
        try:
            result = self.sandbox.process.exec(
                f"git revert -m 1 --no-edit {sha}",
                cwd=self.path,
                timeout=120,
            )
        except Exception as error:
            self._abort_revert()
            if "conflict" in str(error).lower():
                raise git.NeedsPerson(
                    f"The undo hit a conflict on {url}. Resolve it on GitHub, then continue the run. "
                    "The agent will not pull.",
                    undo=True,
                ) from error
            raise
        if result.exit_code not in (0, None):
            self._abort_revert()
            detail = (result.result or "").strip()
            if "conflict" in detail.lower():
                raise git.NeedsPerson(
                    f"The undo hit a conflict on {url}. Resolve it on GitHub, then continue the run. "
                    "The agent will not pull.",
                    undo=True,
                )
            raise RuntimeError(detail or "The undo could not be created.")
        self.sandbox.git.push(
            self.path,
            username="x-access-token",
            password=token,
            set_upstream=True,
        )
        return git.open_pr(
            branch, base, "Undo the last change", reason, token, repository
        )

    def delete(self) -> None:
        if self._temp is not None:
            self._temp.cleanup()
            self._temp = None
        try:
            _client().delete(self.sandbox)
        except Exception as error:
            print(f"Could not delete the sandbox: {error}")

    def _exec(self, command: str, cwd: str) -> str:
        result = self.sandbox.process.exec(command, cwd=cwd, timeout=60)
        if result.exit_code not in (0, None):
            raise RuntimeError(
                (result.result or "").strip() or "Could not read the repository."
            )
        return result.result or ""

    def _branches(self) -> set[str]:
        text = self._exec("git branch --format=%(refname:short)", self.path)
        return {line.strip() for line in text.splitlines() if line.strip()}

    def _fresh_branch(self, base: str) -> str:
        existing = self._branches()
        name = base
        number = 2
        while name in existing:
            name = f"{base}-{number}"
            number += 1
        return name

    def _abort_revert(self) -> None:
        try:
            self.sandbox.process.exec("git revert --abort", cwd=self.path, timeout=30)
        except Exception:
            return


def open_repo(project: Project, token: str) -> RepoSandbox:
    """Create a sandbox, clone the saved branch, and return it.

    The caller deletes the sandbox when the pull request is open.
    """
    if not os.getenv("DAYTONA_API_KEY", "").strip():
        raise RuntimeError("Set DAYTONA_API_KEY before opening a sandbox.")

    token = token.strip()
    if not token:
        raise RuntimeError("A GitHub token is required to clone the repo.")

    owner, name = project.repository.split("/", 1)
    daytona = _client()
    sandbox = daytona.create()
    try:
        sandbox.git.clone(
            url=f"https://github.com/{owner}/{name}.git",
            path=REPO_DIR,
            branch=project.branch,
            username="x-access-token",
            password=token,
        )
    except Exception:
        daytona.delete(sandbox)
        raise

    return RepoSandbox(sandbox=sandbox, path=REPO_DIR)


def demand_message() -> str | None:
    """Refuse a new run when two or more Daytona sandboxes are still open."""
    if not os.getenv("DAYTONA_API_KEY", "").strip():
        return None
    try:
        count = _open_count()
    except Exception:
        return WAIT_MESSAGE
    if count >= SANDBOX_LIMIT:
        return WAIT_MESSAGE
    return None


def _open_count() -> int:
    count = 0
    for sandbox in _client().list():
        state = getattr(sandbox, "state", None)
        name = str(getattr(state, "value", state) or "").lower()
        if name not in _IDLE:
            count += 1
    return count


def _slug(change: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", change.lower()).strip("-")[:40].strip("-")
    return f"builder/{slug or 'change'}"


def _pull_number(url: str) -> str:
    match = re.search(r"/pull/(\d+)", url)
    if not match:
        raise RuntimeError("The pull request URL has no number.")
    return match.group(1)


def _client():
    from daytona import Daytona

    return Daytona()
