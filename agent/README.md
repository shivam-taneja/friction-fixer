# Agent

Python code for the Friction Fixer loop. The full loop is described in [FLOW.md](../FLOW.md).

The Analyst, Reviewer, simulator, and loop are still placeholders. The Builder can already edit `demo-site/` and open a pull request.

## Files

| File           | Job                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `loop.py`      | Runs Analyst, Builder, merge, then Reviewer. Stops after 5 rounds, or when bounce rate hits the goal.                                  |
| `analyst.py`   | Reads visitor data and past verdicts. Writes one plan.                                                                                 |
| `builder/`     | Makes that one change inside `demo-site/`, commits, and opens a pull request. `edit.py` calls Groq. `git.py` commits and opens the PR. |
| `reviewer.py`  | Checks the live page and the new numbers. Returns KEEP or UNDO.                                                                        |
| `simulator.py` | Mock visitor numbers. They must change when the page changes.                                                                          |
| `schemas.py`   | The plan and the verdict the agents pass to each other.                                                                                |
| `tracing.py`   | neatlogs. One round is one trace.                                                                                                      |
| `config.py`    | Round limit (5) and the keep margin (bounce rate down by at least 5 percentage points).                                                |

## Run

Python 3.13 is required. Mac and Windows setup, including pyenv and the virtualenv, is in the [root README](../README.md#setup).

From the repo root, with `venv` activated and `.env` filled in:

```bash
python -m agent
```

To test the Builder on its own, commit `demo-site/` on `main` first, then ask for one change. This pushes a branch and opens a pull request:

```bash
python -m agent.builder "Make the pricing button large and green"
```

`.env` holds `NEATLOGS_API_KEY`, `GITHUB_TOKEN`, `LLM_PROVIDER`, and that provider's API key. It is never committed.

## What this folder uses

This folder imports **neatlogs** for traces. The Builder calls `LLM_PROVIDER` through the OpenAI client library. `litellm` uses the hackathon proxy. `groq` uses Groq.

**Entire** and **cfo.ai** are not imported here. Entire is a CLI on the repo that records why a code change was made. cfo.ai is the business plan, written outside this loop.
