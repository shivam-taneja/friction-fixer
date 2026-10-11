"""The folder inside a repo the Analyst and Builder are allowed to edit."""

from pathlib import Path

from agent.config import REPO_ROOT

TEXT_SUFFIXES = {
    ".html",
    ".css",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".svg",
    ".txt",
    ".md",
}
SKIP_DIRS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    ".next",
    "dist",
    "build",
    "__pycache__",
}
BLOCKED_NAMES = {
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lock",
    "requirements.txt",
    "pyproject.toml",
    "Pipfile",
    "Pipfile.lock",
    "poetry.lock",
    "uv.lock",
}


def source_root(folder: str, repo: Path | None = None) -> Path:
    """Resolve sourceFolder from the project. '.' is the repository root."""
    raw = folder.strip().replace("\\", "/")
    base = _repo(repo)
    if raw in {"", "."}:
        return base
    if raw.startswith("/") or ".." in Path(raw).parts:
        raise RuntimeError("sourceFolder must stay inside the repository.")
    path = (base / raw.strip("/")).resolve()
    root = base
    if path != root and root not in path.parents:
        raise RuntimeError("sourceFolder must stay inside the repository.")
    if not path.is_dir():
        raise RuntimeError(f"{raw} is not a folder in the repository.")
    return path


def folder_label(folder: str) -> str:
    raw = folder.strip().replace("\\", "/")
    if raw in {"", "."}:
        return "the repository root"
    return raw.strip("/") + "/"


def list_source_files(root: Path) -> list[Path]:
    if not root.is_dir():
        raise RuntimeError(f"{root.name} is not a folder in the repository.")
    files = [
        path
        for path in sorted(root.rglob("*"))
        if path.is_file()
        and path.suffix.lower() in TEXT_SUFFIXES
        and path.name not in BLOCKED_NAMES
        and not _skipped(path, root)
    ]
    if not files:
        raise RuntimeError(f"{folder_name(root)} has no source files to edit.")
    return files


def list_source_text(root: Path, repo: Path | None = None) -> str:
    base = _repo(repo)
    return "\n".join(
        path.relative_to(base).as_posix() for path in list_source_files(root)
    )


def read_named(root: Path, names: list[str], repo: Path | None = None) -> str:
    allowed = {path.resolve() for path in list_source_files(root)}
    chosen: list[Path] = []
    for name in names:
        path = resolve_in_source(name, root, repo)
        if path.resolve() not in allowed:
            raise RuntimeError(f"{name} is not a source file.")
        if path not in chosen:
            chosen.append(path)
    if not chosen:
        raise RuntimeError("No source files were opened.")
    return _joined(chosen, repo)


def resolve_in_source(raw: str, root: Path, repo: Path | None = None) -> Path:
    """Accept a repo path or a path relative to the source folder."""
    raw = raw.strip().replace("\\", "/").strip("/")
    if not raw or raw.startswith("/") or ".." in Path(raw).parts:
        raise RuntimeError(f"Refusing path: {raw}")
    repo = _repo(repo)
    root = root.resolve()
    from_repo = (repo / raw).resolve()
    if _inside(from_repo, root):
        path = from_repo
    elif root != repo and _repo_path_outside(raw, repo, root):
        raise RuntimeError(f"Refusing a file outside {folder_name(root, repo)}: {raw}")
    else:
        path = (root / raw).resolve()
        if not _inside(path, root):
            raise RuntimeError(
                f"Refusing a file outside {folder_name(root, repo)}: {raw}"
            )
    if path.name in BLOCKED_NAMES:
        raise RuntimeError(f"Refusing {path.name}. Do not change dependencies.")
    return path


def folder_name(root: Path, repo: Path | None = None) -> str:
    root = root.resolve()
    repo = _repo(repo)
    if root == repo:
        return "the repository root"
    return root.relative_to(repo).as_posix() + "/"


def _repo_path_outside(raw: str, repo: Path, root: Path) -> bool:
    first = Path(raw).parts[0]
    source = root.relative_to(repo).parts[0]
    return first != source and (repo / first).exists()


def _inside(path: Path, root: Path) -> bool:
    return path == root or root in path.parents


def _repo(repo: Path | None) -> Path:
    return (repo or REPO_ROOT).resolve()


def _joined(paths: list[Path], repo: Path | None = None) -> str:
    base = _repo(repo)
    parts = [
        f"--- {path.relative_to(base).as_posix()} ---\n{path.read_text()}"
        for path in paths
    ]
    return "\n\n".join(parts)


def _skipped(path: Path, root: Path) -> bool:
    relative = path.relative_to(root)
    return any(part in SKIP_DIRS for part in relative.parts)
