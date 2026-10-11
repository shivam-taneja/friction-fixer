"""Asks the configured model for one plan. Visitor numbers stay mock."""

from pathlib import Path

from agent.builder.edit import READ_LIMIT, file_loop
from agent.config import BOUNCE_RATE_DROP
from agent.project import Project
from agent.schemas import Plan, Verdict, VisitorData
from agent.source import resolve_in_source, source_root


def choose(
    visitors: VisitorData, history: list[Verdict], project: Project, repo: Path
) -> Plan:
    """Ask the model for one change. It must not repeat a change already undone."""
    root = source_root(project.source_folder, repo)
    data = file_loop(
        _system(project),
        _brief(visitors, history, project),
        root,
        _plan_ready,
        _PLAN_HINT,
        repo,
    )
    return _parse_plan(data, visitors, history, project, repo)


def _system(project: Project) -> str:
    return (
        "You are the Analyst. "
        "You receive mock visitor numbers, the project goal, past verdicts, and a file list. "
        "Every reply is one JSON object and nothing else. "
        "Open the files you need before you pick a change. "
        "To open files, use only this shape: "
        '{"read":["path/from/the/file/list"]}. '
        f"At most {READ_LIMIT} paths. Copy each path from the file list. "
        "You can ask again after you see the files. "
        "When you are ready, use only this shape: "
        '{"problem":"one sentence","evidence":"the numbers",'
        '"change":"the one change","file":"path/from/the/file/list",'
        '"expected_effect":"what should improve"}. '
        "Do not include read in that reply. "
        "Pick ONE change that should move the project toward that goal. "
        f"The editable folder is {project.root_label()}. "
        "The builder may edit any source file inside it. "
        "Use the visitor numbers you are given. Call them mock. "
        f"expected_effect must say what should improve, including a bounce-rate drop of at least "
        f"{int(BOUNCE_RATE_DROP * 100)} percentage points when bounce rate is the goal. "
        "Do not propose a change that a past UNDO verdict already rejected."
    )


def _brief(visitors: VisitorData, history: list[Verdict], project: Project) -> str:
    return "\n\n".join(
        [
            f"Goal: {project.goal}",
            f"Framework: {project.framework_label()}",
            f"Repository: {project.repository} ({project.branch})",
            f"Editable folder: {project.root_label()}",
            "Visitor numbers:\n" + _evidence(visitors),
            "Past verdicts:\n" + _history(history),
        ]
    )


def _evidence(visitors: VisitorData) -> str:
    return (
        f"Mock data. Bounce rate {visitors.bounce_rate:.0%}. "
        f"Average scroll depth {visitors.scroll_depth:.0%}. "
        f"Average time on page {visitors.time_on_page:.1f}s. "
        f"Pricing page visits {visitors.pricing_page_visits}."
    )


def _history(history: list[Verdict]) -> str:
    if not history:
        return "None yet."
    lines: list[str] = []
    for item in history:
        before = item.numbers_before.bounce_rate
        after = item.numbers_after.bounce_rate
        lines.append(
            f"{item.decision}. Site check: {item.site_check}. "
            f"Bounce rate {before:.0%} -> {after:.0%}. "
            f"Reason: {item.reason}"
        )
    return "\n".join(lines)


_PLAN_HINT = (
    "Reply with one JSON object. "
    'To open files: {"read":["path/from/the/file/list"]}. '
    "When finished: "
    '{"problem":"one sentence","evidence":"the numbers",'
    '"change":"the one change","file":"path/from/the/file/list",'
    '"expected_effect":"what should improve"}. '
    "Do not add any other text."
)


def _plan_ready(data: dict) -> bool:
    file_name = data.get("file")
    if isinstance(file_name, list):
        file_name = " and ".join(str(part) for part in file_name)
    if not isinstance(file_name, str) or not file_name.strip():
        return False
    for key in ("problem", "change", "expected_effect"):
        value = data.get(key)
        if not isinstance(value, str) or not value.strip():
            return False
    return True


def _parse_plan(
    data: dict,
    visitors: VisitorData,
    history: list[Verdict],
    project: Project,
    repo: Path,
) -> Plan:
    plan = Plan(
        problem=_text(data, "problem"),
        evidence=_evidence(visitors),
        change=_text(data, "change"),
        file=_check_file(_file_name(data), project, repo),
        expected_effect=_text(data, "expected_effect"),
    )
    undone = [item.reason for item in history if item.decision == "UNDO"]
    if any(plan.change and plan.change in reason for reason in undone):
        raise RuntimeError("The model repeated a change that was already undone.")
    return plan


def _file_name(data: dict) -> str:
    value = data.get("file")
    if isinstance(value, list):
        return " and ".join(str(part).strip() for part in value if str(part).strip())
    if isinstance(value, str):
        return value
    return ""


def _text(data: dict, key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise RuntimeError(f"The model left {key} empty.")
    return value.strip()


def _check_file(raw: str, project: Project, repo: Path) -> str:
    root = source_root(project.source_folder, repo)
    base = repo.resolve()
    parts: list[str] = []
    for part in raw.split(" and "):
        if not part.strip():
            continue
        path = resolve_in_source(part, root, repo)
        if path == base:
            parts.append(".")
        else:
            parts.append(path.relative_to(base).as_posix())
    if not parts:
        raise RuntimeError("The model did not name a file.")
    return " and ".join(parts)
