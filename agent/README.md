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

Python 3.13 is required. Mac and Windows setup, including pyenv and the virtualenv, is in the [root README](../README.md#setup).

From the repo root, with `venv` activated and `.env` filled in:

```bash
python -m agent
```

`.env` holds `NEATLOGS_API_KEY`, `GITHUB_TOKEN`, and `OPENAI_API_KEY`. It is never committed.

## What this folder uses

This folder only imports **neatlogs**, and only once `tracing.py` is filled in. You can write the loop before that key exists.

**Entire** and **cfo.ai** are not imported here. Entire is a CLI on the repo that records why a code change was made. cfo.ai is the business plan, written outside this loop.
