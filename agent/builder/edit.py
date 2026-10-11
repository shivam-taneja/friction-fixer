"""Asks the configured model for one edit and writes it inside the project source folder."""

import json
import os
import re
from pathlib import Path

import neatlogs
from openai import OpenAI

from agent.builder.text import plan_text
from agent.project import Project
from agent.schemas import Plan
from agent.source import list_source_text, read_named, resolve_in_source, source_root

PROVIDERS = {
    "litellm": {
        "base_url": "https://litellm.vision.aivar.app/v1",
        "api_key_env": "LITELLM_API_KEY",
        "model": "claude-sonnet-4.6",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model": "openai/gpt-oss-120b",
    },
}


def provider_settings() -> tuple[str, str, str]:
    """Return the API key, base URL, and model for LLM_PROVIDER."""
    name = os.getenv("LLM_PROVIDER", "litellm").strip().lower()
    spec = PROVIDERS.get(name)
    if spec is None:
        known = ", ".join(sorted(PROVIDERS))
        raise RuntimeError(f"LLM_PROVIDER must be one of: {known}.")
    key = os.getenv(spec["api_key_env"], "").strip()
    if not key:
        raise RuntimeError(
            f"Set {spec['api_key_env']} in agent/.env for the {name} provider."
        )
    model = os.getenv("LLM_MODEL", "").strip() or spec["model"]
    return key, spec["base_url"], model


READ_LIMIT = 8
TURN_LIMIT = 6


def file_loop(system: str, task: str, root: Path, done, hint: str, repo: Path) -> dict:
    """Let the model ask for files until it returns a finished answer.

    {"read":["path"]} opens those files and continues. A finished answer,
    checked by done, ends the loop. Anything else is sent back for another try.
    """
    api_key, base_url, model = provider_settings()
    client = neatlogs.wrap(OpenAI(api_key=api_key, base_url=base_url))
    messages = [
        {"role": "system", "content": system},
        {
            "role": "user",
            "content": task + "\n\nFile list:\n" + list_source_text(root, repo),
        },
    ]
    last_error = "The model did not finish."
    for _ in range(TURN_LIMIT):
        response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=messages,
        )
        text = response.choices[0].message.content or ""
        try:
            data = _json_object(text)
        except RuntimeError as error:
            last_error = str(error)
            _reply(messages, text, f"{last_error} {hint}")
            continue
        if done(data):
            return data
        names = _read_names(data)
        if names:
            try:
                note = "Opened files:\n\n" + read_named(root, names[:READ_LIMIT], repo)
            except RuntimeError as error:
                note = f"{error} {hint}"
            _reply(messages, text, note)
            continue
        last_error = "That JSON did not open files and was not a finished answer."
        _reply(messages, text, f"{last_error} {hint}")
    raise RuntimeError(last_error)


def edit_site(plan: Plan, project: Project, repo: Path) -> list[Path]:
    root = source_root(project.source_folder, repo)
    mistake = ""
    last_error = "The model did not change any files."
    for _ in range(2):
        correction = f"\n\nYour last answer was rejected: {mistake}" if mistake else ""
        try:
            data = file_loop(
                _edit_system(project),
                plan_text(plan) + correction,
                root,
                _edit_ready,
                _EDIT_HINT,
                repo,
            )
            edits = _edits(data, root, repo)
        except RuntimeError as error:
            last_error = str(error)
            mistake = last_error
            continue
        written: list[Path] = []
        for path, content in edits:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
            written.append(path)
        return written
    raise RuntimeError(last_error)


def _edit_system(project: Project) -> str:
    return (
        "You edit source files in a repository. "
        "Every reply is one JSON object and nothing else. "
        "To open files, use only this shape: "
        '{"read":["path/from/the/file/list"]}. '
        f"At most {READ_LIMIT} paths. Copy each path from the file list. "
        "You can ask again after you see the files. "
        "When you are ready to edit, use only this shape: "
        '{"files":[{"path":"path/from/the/file/list","content":"full file"}]}. '
        "Do not include read in that reply. "
        "Include the full new contents of each file you change. "
        "Change only what the plan asks for. "
        f"You may edit any source file inside {project.root_label()}. "
        f"Framework: {project.framework_label()}. "
        "Do not edit dependency files or lockfiles."
    )


_EDIT_HINT = (
    "Reply with one JSON object. "
    'To open files: {"read":["path/from/the/file/list"]}. '
    'When finished: {"files":[{"path":"path/from/the/file/list","content":"full file"}]}. '
    "Do not add any other text."
)


def _reply(messages: list[dict], answer: str, note: str) -> None:
    messages.append({"role": "assistant", "content": answer or "{}"})
    messages.append({"role": "user", "content": note})


def _json_object(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end <= start:
            raise RuntimeError("The model did not return JSON.")
        try:
            data = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError as error:
            raise RuntimeError("The model did not return JSON.") from error
    if not isinstance(data, dict):
        raise RuntimeError("The model did not return JSON.")
    return data


def _read_names(data: dict) -> list[str]:
    for key in ("read", "paths", "files_to_read", "open"):
        names = _as_paths(data.get(key))
        if names:
            return names
    if "files" in data or "problem" in data or "content" in data:
        return []
    for key in ("file", "path"):
        names = _as_paths(data.get(key))
        if names:
            return names
    return []


def _as_paths(value) -> list[str]:
    if isinstance(value, str):
        parts = re.split(r"[\n,]", value)
        return [part.strip().strip("\"'") for part in parts if part.strip()]
    if not isinstance(value, list):
        return []
    names: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            names.append(item.strip())
        elif isinstance(item, dict):
            path = item.get("path") or item.get("file")
            if isinstance(path, str) and path.strip():
                names.append(path.strip())
    return names


def _edit_ready(data: dict) -> bool:
    return bool(_file_items(data))


def _file_items(data: dict) -> list[dict]:
    files = data.get("files")
    if isinstance(files, dict):
        files = [files]
    if not isinstance(files, list):
        return []
    ready: list[dict] = []
    for item in files:
        if not isinstance(item, dict):
            continue
        path = item.get("path") or item.get("file")
        content = item.get("content")
        if (
            isinstance(path, str)
            and path.strip()
            and isinstance(content, str)
            and content
        ):
            ready.append(item)
    return ready


def _edits(data: dict, root: Path, repo: Path) -> list[tuple[Path, str]]:
    files = _file_items(data)
    if not files:
        raise RuntimeError("The model did not return any files to change.")
    edits: list[tuple[Path, str]] = []
    for item in files:
        raw = str(item.get("path") or item.get("file") or "")
        path = resolve_in_source(raw, root, repo)
        if path.is_dir():
            raise RuntimeError(f"Refusing a directory: {path.name}")
        content = item.get("content")
        if not isinstance(content, str) or content == "":
            raise RuntimeError(f"The model returned empty contents for {path.name}.")
        edits.append((path, content))
    return edits
