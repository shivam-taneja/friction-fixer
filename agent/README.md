# Agent

Python code for the Friction Fixer loop. The full loop is described in [FLOW.md](../FLOW.md).

The loop runs one round. The Builder opens a pull request and the loop merges it before the review, so the site is live. The after-numbers are still mock. On KEEP the change stays. On UNDO the loop opens a second pull request that reverts it, then merges that too. The Reviewer does not touch git.

## Files

| File         | Job                                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loop.py`    | One round: `run(case, user_id, run_id)`. Merges the Builder pull request, then reviews the mock after-numbers. On UNDO, opens and merges a revert pull request. |
| `server.py`  | HTTP entry. The website posts a run id, and the server starts that round.                                                                                     |
| `progress.py`| Writes each step onto the Firestore run so the website can show it.                                                                                           |
| `analyst/`   | Reads mock PostHog events and past verdicts. Writes one plan. `events.py` loads `fixtures/events.json`. `plan.py` asks the configured model for the change. |
| `builder/`   | Makes that one change inside the project's source folder, commits, and opens a pull request. `edit.py` calls the model. `git.py` commits and opens the PR. |
| `reviewer/`  | Asks the simulator for one outcome, then returns KEEP or UNDO. The verdict goes back to the Analyst through the loop.                                       |
| `simulator/` | Asks the model for the starting numbers and, after the edit, for one improved outcome and one worse outcome.                                                |
| `schemas.py` | The plan and the verdict the agents pass to each other.                                                                                                     |
| `tracing.py` | neatlogs. One round is one trace.                                                                                                                           |
| `project.py` | Loads the user's project and GitHub installation from Firestore. The editable folder is `sourceFolder`.                                                     |
| `source.py`  | Lists and checks files inside that folder. Skips dependencies and lockfiles.                                                                                |
| `config.py`  | Round limit (5) and the keep margin (bounce rate down by at least 5 percentage points).                                                                     |

## Run

Python 3.13 is required. Mac and Windows setup, including pyenv and the virtualenv, is in the [root README](../README.md#setup).

The website starts a round. The deployed process is:

```bash
python -m agent.server
```

It listens for `POST /runs` with the shared `AGENT_SECRET`. The body is the run id, the signed-in user id, and `increased` or `decreased`. A new run is refused while two or more Daytona sandboxes are still open. The Firebase service account fields in `agent/.env` match `web/.env`.

`increased` keeps the merged change. `decreased` opens a second pull request that undoes it and merges that too. The working tree must be clean, because the Builder commits only the new edit.

`agent/.env` holds `NEATLOGS_API_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `LLM_PROVIDER`, and that provider's API key. The GitHub values match the website. Copy it from `agent/.env.example`. It is never committed. The site keeps its own secrets in `web/.env`.

## What this folder uses

This folder imports **neatlogs** for traces. The Builder calls `LLM_PROVIDER` through the OpenAI client library. `litellm` uses the hackathon proxy. `groq` uses Groq.

**Entire** and **cfo.ai** are not imported here. Entire is a CLI on the repo that records why a code change was made. cfo.ai is the business plan, written outside this loop.
