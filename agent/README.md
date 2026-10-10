# Agent

Python code for the Friction Fixer loop. The full loop is described in [FLOW.md](../FLOW.md).

These files are placeholders. Each function raises `NotImplementedError`.

## Files

| File           | Job                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `loop.py`      | Runs Analyst, Builder, merge, then Reviewer. Stops after 5 rounds, or when bounce rate hits the goal. |
| `analyst.py`   | Reads visitor data and past verdicts. Writes one plan.                                                |
| `builder.py`   | Makes that one change inside `demo-site/`, commits, and opens a pull request.                         |
| `reviewer.py`  | Checks the live page and the new numbers. Returns KEEP or UNDO.                                       |
| `simulator.py` | Mock visitor numbers. They must change when the page changes.                                         |
| `schemas.py`   | The plan and the verdict the agents pass to each other.                                               |
| `tracing.py`   | neatlogs. One round is one trace.                                                                     |
| `config.py`    | Round limit (5) and the keep margin (bounce rate down by at least 5 percentage points).               |

## Run

From the repo root, once the placeholders are filled in:

```bash
python -m agent
```

Install the dependency and copy the env file first:

```bash
pip install -r agent/requirements.txt
cp .env.example .env
```

`.env` holds `NEATLOGS_API_KEY`, `GITHUB_TOKEN`, and `OPENAI_API_KEY`. It is never committed.

## What this folder uses

This folder only imports **neatlogs**, and only once `tracing.py` is filled in. You can write the loop before that key exists.

**Entire** and **cfo.ai** are not imported here. Entire is a CLI on the repo that records why a code change was made. cfo.ai is the business plan, written outside this loop.
