# Agent

Python code for the Friction Fixer loop. The full loop is described in [FLOW.md](../FLOW.md).

The Analyst reads a mock PostHog export and writes one plan. The Builder can edit `demo-site/` and open a pull request. The Reviewer compares mock before and after numbers and returns KEEP or UNDO. The simulator and the loop are still placeholders.

## Files

| File           | Job                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `loop.py`      | Runs Analyst, Builder, merge, then Reviewer. Stops after 5 rounds, or when bounce rate hits the goal.                                  |
| `analyst/`     | Reads mock PostHog events and past verdicts. Writes one plan. `events.py` loads `fixtures/events.json`. `plan.py` asks the configured model for the change. |
| `builder/`     | Makes that one change inside `demo-site/`, commits, and opens a pull request. `edit.py` calls Groq. `git.py` commits and opens the PR. |
| `reviewer/`    | Compares one change with mock before and after numbers. Returns KEEP or UNDO for the loop to pass back to the Analyst. `fixtures/increased.json` clears the margin. `fixtures/decreased.json` misses it. |
| `simulator.py` | Mock visitor numbers. They must change when the page changes.                                                                          |
| `schemas.py`   | The plan and the verdict the agents pass to each other.                                                                                |
| `tracing.py`   | neatlogs. One round is one trace.                                                                                                      |
| `config.py`    | Round limit (5) and the keep margin (bounce rate down by at least 5 percentage points).                                                |

## Run

Python 3.13 is required. Mac and Windows setup, including pyenv and the virtualenv, is in the [root README](../README.md#setup).

From the repo root, with `venv` activated and `agent/.env` filled in:

```bash
python -m agent
```

To print the Analyst plan from the mock PostHog export:

```bash
python -m agent.analyst
```

To judge the two temp result files:

```bash
python -m agent.reviewer increased
python -m agent.reviewer decreased
```

To test the Builder on its own, commit `demo-site/` on `main` first, then ask for one change. This pushes a branch and opens a pull request:

```bash
python -m agent.builder "Make the pricing button large and green"
```

`agent/.env` holds `NEATLOGS_API_KEY`, `GITHUB_TOKEN`, `LLM_PROVIDER`, and that provider's API key. Copy it from `agent/.env.example`. It is never committed. The site keeps its own secrets in `web/.env`.

## What this folder uses

This folder imports **neatlogs** for traces. The Builder calls `LLM_PROVIDER` through the OpenAI client library. `litellm` uses the hackathon proxy. `groq` uses Groq.

**Entire** and **cfo.ai** are not imported here. Entire is a CLI on the repo that records why a code change was made. cfo.ai is the business plan, written outside this loop.
