# Agent

Python code for the Friction Fixer loop. The full loop is described in [FLOW.md](../FLOW.md).

The website starts one round. The Builder edits the project's source folder, commits, and opens a pull request with the GitHub App. The loop merges that pull request before the review, so the site is live. The after-numbers are still mock. On KEEP the change stays. On UNDO the loop opens a second pull request that reverts the change, then merges that too. The Reviewer does not touch git.

If GitHub will not merge because of a conflict, or because the branch is behind, the run pauses. A person resolves it on GitHub and continues the run. The agent does not pull or rewrite the branch.

A first run generates mock starting numbers. The next run uses the latest saved set: the after numbers when the last change was kept, the before numbers when it was undone. Past verdicts go to the Analyst.

## Files

| File          | Job                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loop.py`     | One round: `run(case, user_id, run_id)`. `continue_run(user_id, run_id)` finishes a run that was waiting on a person.                                                                                                                        |
| `server.py`   | HTTP entry. `POST /runs` starts a round. `POST /runs/continue` resumes one. `GET /` is the health check.                                                                                                                                     |
| `progress.py` | Writes each step onto the Firestore `runs` document.                                                                                                                                                                                         |
| `history.py`  | Reads earlier runs so the next change starts from the latest saved numbers and past verdicts.                                                                                                                                                |
| `analyst/`    | Asks the model for one plan. The model requests files, then returns the plan. Past UNDO verdicts are included.                                                                                                                               |
| `builder/`    | Edits the source folder inside a Daytona clone, commits, and opens a pull request. `edit.py` calls the model. `sandbox.py` clones, writes, and pushes. `git.py` merges through the GitHub API. `github_app.py` mints the installation token. |
| `reviewer/`   | Compares the mock before and after numbers and returns KEEP or UNDO. KEEP requires bounce rate to fall by at least 5 percentage points.                                                                                                      |
| `simulator/`  | Asks the model for the first baseline and, after the edit, for one improved outcome and one worse outcome.                                                                                                                                   |
| `schemas.py`  | The plan and the verdict the agents pass to each other.                                                                                                                                                                                      |
| `tracing.py`  | neatlogs. One round is one trace.                                                                                                                                                                                                            |
| `project.py`  | Loads the user's project and GitHub installation from Firestore. The editable folder is `sourceFolder`.                                                                                                                                      |
| `source.py`   | Lists and checks files inside that folder. Skips dependencies and lockfiles. Accepts HTML, CSS, JS, TS, and Python, among others.                                                                                                            |
| `config.py`   | The keep margin: bounce rate down by at least 5 percentage points.                                                                                                                                                                           |

## Run

Python 3.13 is required. Mac and Windows setup, including pyenv and the virtualenv, is in the [root README](../README.md#setup).

The website starts a round. The deployed process is:

```bash
python -m agent.server
```

`POST /runs` needs `Authorization: Bearer <AGENT_SECRET>`. The body is the run id, the signed-in user id, and `increased` or `decreased`. `increased` is the improved mock outcome. `decreased` is the worse one. The Reviewer still decides KEEP or UNDO from the bounce-rate margin.

`POST /runs/continue` uses the same secret. The body is the run id and the user id. It merges the pull request after a person has resolved a conflict, then finishes the round.

Each run clones the project's repository into a Daytona sandbox and edits that clone. The Render process does not commit inside its own checkout. A new run is refused while two or more sandboxes are open. `DAYTONA_API_KEY` is required.

After the round, `neatlogs.flush` sends the trace. One round is one trace named `friction-fix-round`. Those traces are on the [project home](https://app.neatlogs.com/home?orgId=8ac25f73-a91e-48fa-b5d2-807fcfcec81c&projectId=8d1337ef-31f4-4b33-9770-92d681f9a1b3), which is not a public share of one trace.

`agent/.env` holds `NEATLOGS_API_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `LLM_PROVIDER`, that provider's API key, `AGENT_SECRET`, and the Firebase service account fields. The GitHub and Firebase values match the website. Copy it from `agent/.env.example`. It is never committed.

## What this folder uses

This folder imports **neatlogs** for traces. The Builder and Analyst call `LLM_PROVIDER` through the OpenAI client library. `litellm` uses the hackathon proxy. `groq` uses Groq. Git and pull requests use a short-lived GitHub App installation token.

**Entire** and **cfo.ai** are not imported here. Entire is a CLI on the repo that records why a code change was made. cfo.ai is the business plan, written outside this loop.
