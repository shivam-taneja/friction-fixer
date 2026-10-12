# Agent

Python code for the Friction Fixer loop. The full loop is described in [FLOW.md](../FLOW.md).

The website starts one round. The Builder edits the project's source folder, commits, and opens a pull request with the GitHub App. The loop merges that pull request before the review, so the site is live. On KEEP the change stays. On UNDO the loop opens a second pull request that reverts the change, then merges that too. The Reviewer does not touch git.

If GitHub will not merge because of a conflict, or because the branch is behind, the run pauses. A person resolves it on GitHub and continues the run. The agent does not pull or rewrite the branch.

Mock data is off unless `users/{userId}.useMockData` is true. A mock run invents the after numbers from the improved or worse choice. The next mock run uses the latest saved set for that same project: the after numbers when the last change was kept, the before numbers when it was undone. Past verdicts for that project go to the Analyst.

A live run reads the last 7 days from PostHog, saves them as `before`, merges the change, then sets status `measuring`. `checkAfter` is that moment plus the user's check wait, and `measuredFrom` is that moment. The wait is `users/{userId}.checkAfterHours`: 1 to 336 hours, default 168. Changing Settings later does not rewrite a run that already has `checkAfter`. It does not invent after numbers and it does not KEEP or UNDO yet. `python -m agent.check` finds those runs once `checkAfter` has passed, reads PostHog from `measuredFrom` until `checkAfter`, and then KEEP or UNDO. A run saved before `measuredFrom` existed is checked over the 7 days ending at `checkAfter`. The next live run reads PostHog again. It does not continue from the previous after numbers. Past verdicts for the same project still go to the Analyst. Measuring holds that user's lock and does not count toward the two-sandbox cap. The sandbox is opened only if the verdict is UNDO.

Run statuses are `queued`, `running`, `kept`, `undone`, `failed`, `blocked`, and `measuring`. `blocked` means Needs you. Restart this process after a Python change. The server does not reload files by itself.

## Files

| File          | Job                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loop.py`     | One round: `run(case, user_id, run_id)`. `case` is `increased`, `decreased`, or `live`. `continue_run(user_id, run_id)` finishes a run that was waiting on a person. `settle_live` is the KEEP or UNDO after a live check.                   |
| `server.py`   | HTTP entry. `POST /runs` starts a round. `POST /runs/continue` resumes one. `GET /readiness` checks the baseline. `GET /capacity` checks the sandbox cap. `GET /` is the health check.                                                       |
| `check.py`    | `python -m agent.check`. Finishes live runs whose `checkAfter` has passed.                                                                                                                                                                   |
| `posthog.py`  | Reads the connected PostHog project. The baseline is the last 7 days. The check reads the window since the change.                                                                                                                           |
| `progress.py` | Writes each step onto the Firestore `runs` document. `measuring` keeps the user lock.                                                                                                                                                        |
| `history.py`  | Reads earlier runs for the same project so the next change starts from the latest saved numbers and past verdicts.                                                                                                                           |
| `analyst/`    | Asks the model for one plan. The model requests files, then returns the plan. Past UNDO verdicts are included.                                                                                                                               |
| `builder/`    | Edits the source folder inside a Daytona clone, commits, and opens a pull request. `edit.py` calls the model. `sandbox.py` clones, writes, and pushes. `git.py` merges through the GitHub API. `github_app.py` mints the installation token. |
| `reviewer/`   | Compares before and after numbers and returns KEEP or UNDO. KEEP requires bounce rate to fall by at least 5 percentage points. Other metrics are recorded and do not decide.                                                                 |
| `simulator/`  | Mock runs only. Asks the model for the first baseline and, after the edit, for one improved outcome and one worse outcome.                                                                                                                   |
| `schemas.py`  | The plan and the verdict the agents pass to each other.                                                                                                                                                                                      |
| `tracing.py`  | neatlogs. One round is one trace.                                                                                                                                                                                                            |
| `project.py`  | Loads the user's project and GitHub installation from Firestore. The editable folder is `sourceFolder`.                                                                                                                                      |
| `source.py`   | Lists and checks files inside that folder. Skips dependencies and lockfiles. Accepts HTML, CSS, JS, TS, and Python, among others.                                                                                                            |
| `config.py`   | The keep margin, and the check-wait bounds: 1 hour through 14 days, default 7 days. The saved value is on the user.                                                                                                                          |

## Run

Python 3.13 is required. Mac and Windows setup, including pyenv and the virtualenv, is in the [root README](../README.md#setup).

The website starts a round. The deployed process is:

```bash
python -m agent.server
```

`POST /runs` needs `Authorization: Bearer <AGENT_SECRET>`. The body is the run id, the signed-in user id, and `increased`, `decreased`, or `live`. `increased` is the improved mock outcome. `decreased` is the worse one. `live` saves the PostHog baseline and waits for `python -m agent.check`. The wait comes from that user's Settings. The Reviewer still decides KEEP or UNDO from the bounce-rate margin.

`POST /runs/continue` uses the same secret. The body is the run id and the user id. It merges the pull request after a person has resolved a conflict, then finishes the round. A live run that was blocked schedules the check after that merge. It does not invent after numbers.

The check job is a separate process:

```bash
python -m agent.check
```

It needs the Firebase, GitHub App, and Daytona variables. It does not need `AGENT_SECRET` or the LLM keys. Each claimed run opens the same `friction-fix-round` trace as a new run, with the reviewer span inside it, for both KEEP and UNDO. A missing `NEATLOGS_API_KEY` turns trace export off. The job claims a due run by setting it to `running` before the PostHog read, so two overlapping runs do not finish it twice. If the process dies, a `running` live run whose `checkingAt` is at least 45 minutes old can be claimed again. If PostHog has no sessions in the window, or the request fails, the run goes back to `measuring` and keeps `checkAfter`.

Each run clones the project's repository into a Daytona sandbox and edits that clone. The Render process does not commit inside its own checkout. A new run is refused while two or more sandboxes are open. `DAYTONA_API_KEY` is required.

After the round, `neatlogs.flush` sends the trace. One round is one trace named `friction-fix-round`. Those traces are on the [project home](https://app.neatlogs.com/home?orgId=8ac25f73-a91e-48fa-b5d2-807fcfcec81c&projectId=8d1337ef-31f4-4b33-9770-92d681f9a1b3). That URL is the project home. A public link is a share of one trace.

`agent/.env` holds `NEATLOGS_API_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `DAYTONA_API_KEY`, `LLM_PROVIDER`, that provider's API key (`LITELLM_API_KEY` or `GROQ_API_KEY`), `LLM_MODEL`, `AGENT_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. The GitHub and Firebase values match the website. Copy it from `agent/.env.example`. It is never committed. Do not print it.

## What this folder uses

This folder imports **neatlogs** for traces. The Builder and Analyst call `LLM_PROVIDER` through the OpenAI client library. `litellm` uses the hackathon proxy. `groq` uses Groq. Git and pull requests use a short-lived GitHub App installation token.

**Entire** and **cfo.ai** are not imported here. Entire is a CLI on the repo that records why a code change was made. cfo.ai is the business plan, written outside this loop. The handoff for that work is in the root [README](../README.md#cfoai). Do not add billing or a pricing model to this folder for that task.
