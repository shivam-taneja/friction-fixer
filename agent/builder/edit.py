"""Asks the configured model for one edit and writes it inside demo-site/."""

import json
import os
import re
from pathlib import Path

import neatlogs
from openai import OpenAI

from agent.builder.text import plan_text
from agent.config import DEMO_SITE_DIR, REPO_ROOT
from agent.schemas import Plan

TEXT_SUFFIXES = {".html", ".css", ".js", ".svg", ".txt", ".md"}
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


def edit_site(plan: Plan) -> list[Path]:
    current = _read_site()
    api_key, base_url, model = provider_settings()
    client = neatlogs.wrap(OpenAI(api_key=api_key, base_url=base_url))
    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You edit a static site. Return JSON only, with the shape "
                    '{"files":[{"path":"demo-site/style.css","content":"full file"}]}. '
                    "Include the full new contents of each file you change. "
                    "Change only what the plan asks for. "
                    "Every path must stay inside demo-site/."
                ),
            },
            {
                "role": "user",
                "content": plan_text(plan) + "\n\nCurrent files:\n\n" + current,
            },
        ],
    )
    text = response.choices[0].message.content or ""
    written: list[Path] = []
    for item in _parse_files(text):
        path = _site_path(str(item.get("path", "")), plan)
        content = item.get("content")
        if not isinstance(content, str) or content == "":
            raise RuntimeError(f"The model returned empty contents for {path.name}.")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        written.append(path)
    if not written:
        raise RuntimeError("The model did not change any files.")
    return written


def _read_site() -> str:
    parts: list[str] = []
    for path in _site_files():
        relative = path.relative_to(REPO_ROOT).as_posix()
        parts.append(f"--- {relative} ---\n{path.read_text()}")
    return "\n\n".join(parts)


def _site_files() -> list[Path]:
    if not DEMO_SITE_DIR.exists():
        raise RuntimeError("demo-site/ does not exist yet.")
    files = [
        path
        for path in sorted(DEMO_SITE_DIR.rglob("*"))
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES
    ]
    if not files:
        raise RuntimeError("demo-site/ has no pages to edit.")
    return files


def _parse_files(text: str) -> list[dict]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise RuntimeError("The model did not return JSON.") from error
    files = data.get("files") if isinstance(data, dict) else None
    if not isinstance(files, list) or not files:
        raise RuntimeError("The model did not return any files to change.")
    return [item for item in files if isinstance(item, dict)]


def _site_path(raw: str, plan: Plan) -> Path:
    raw = raw.strip().replace("\\", "/")
    if not raw or raw.startswith("/"):
        raise RuntimeError(f"Refusing path: {raw}")
    relative = raw if raw.startswith("demo-site/") else f"demo-site/{raw}"
    path = (REPO_ROOT / relative).resolve()
    demo = DEMO_SITE_DIR.resolve()
    if path != demo and demo not in path.parents:
        raise RuntimeError(f"Refusing a file outside demo-site: {raw}")
    allowed = _allowed_files(plan)
    if allowed is not None and path not in allowed:
        raise RuntimeError(f"The plan does not allow editing {relative}.")
    return path


def _allowed_files(plan: Plan) -> set[Path] | None:
    raw = plan.file.strip().replace("\\", "/")
    if raw in {"demo-site", "demo-site/"}:
        return None
    allowed: set[Path] = set()
    for part in raw.split(" and "):
        part = part.strip()
        if not part:
            continue
        path = (REPO_ROOT / part).resolve()
        allowed.add(path)
    return allowed or None
