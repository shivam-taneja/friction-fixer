"""Loads the signed-in user's project and GitHub installation from Firestore."""

import os
from dataclasses import dataclass

from agent.source import folder_label

FRAMEWORKS = {
    "next": "Next.js",
    "nuxt": "Nuxt",
    "sveltekit": "SvelteKit",
    "remix": "Remix",
    "astro": "Astro",
    "gatsby": "Gatsby",
    "angular": "Angular",
    "cra": "Create React App",
    "vite": "Vite",
    "vue": "Vue",
    "svelte": "Svelte",
    "html": "HTML",
    "other": "a simple site",
}


@dataclass
class Project:
    user_id: str
    analytics_provider: str
    goal: str
    repository: str
    branch: str
    framework: str
    source_folder: str
    installation_id: int
    account_login: str

    def root_label(self) -> str:
        return folder_label(self.source_folder)

    def framework_label(self) -> str:
        return FRAMEWORKS.get(self.framework, self.framework or "a simple site")


def load_project(user_id: str) -> Project:
    """Read projects and githubInstallations for the signed-in user."""
    user_id = user_id.strip()
    if not user_id:
        raise RuntimeError("A user id is required.")

    client = _client()
    projects = list(
        client.collection("projects").where("userId", "==", user_id).limit(1).stream()
    )
    if not projects:
        raise RuntimeError(f"No project is saved for {user_id}.")

    data = projects[0].to_dict() or {}
    installation = client.collection("githubInstallations").document(user_id).get()
    install = installation.to_dict() if installation.exists else None
    if not install:
        raise RuntimeError(f"No GitHub installation is saved for {user_id}.")

    project = _project(user_id, data)
    saved_id = _installation_id(install.get("installationId"))
    if saved_id != project.installation_id:
        raise RuntimeError("The GitHub installation does not match the project.")
    if str(install.get("accountLogin") or "") != project.account_login:
        raise RuntimeError("The GitHub account does not match the project.")
    return project


def _project(user_id: str, data: dict) -> Project:
    repository = _text(data, "repository")
    branch = _text(data, "branch")
    source_folder = str(data.get("sourceFolder") or "").strip()
    if not source_folder:
        raise RuntimeError("The project has no sourceFolder.")
    goal = _text(data, "goal")
    return Project(
        user_id=user_id,
        analytics_provider=_text(data, "analyticsProvider"),
        goal=goal,
        repository=repository,
        branch=branch,
        framework=str(data.get("framework") or "other").strip() or "other",
        source_folder=source_folder,
        installation_id=_installation_id(data.get("installationId")),
        account_login=_text(data, "accountLogin"),
    )


def _client():
    from google.cloud import firestore
    from google.oauth2 import service_account

    project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL", "").strip()
    private_key = _private_key(os.getenv("FIREBASE_PRIVATE_KEY", ""))
    if not project_id or not client_email or "BEGIN" not in private_key:
        raise RuntimeError(
            "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and "
            "FIREBASE_PRIVATE_KEY in agent/.env."
        )

    credentials = service_account.Credentials.from_service_account_info(
        {
            "type": "service_account",
            "project_id": project_id,
            "private_key": private_key,
            "client_email": client_email,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    )
    return firestore.Client(project=project_id, credentials=credentials)


def _private_key(raw: str) -> str:
    key = raw.strip()
    if (key.startswith('"') and key.endswith('"')) or (
        key.startswith("'") and key.endswith("'")
    ):
        key = key[1:-1]
    return key.replace("\\n", "\n")


def _text(data: dict, key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise RuntimeError(f"The project is missing {key}.")
    return value.strip()


def _installation_id(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise RuntimeError("The project is missing installationId.")
    return value
