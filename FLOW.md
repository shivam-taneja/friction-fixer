# Friction Fixer: How the Loop Works

This file explains what each agent does, what it receives, and what it hands to the next one.

## The loop at a glance

```
  Dashboard: Start run
       |
       +-- mock on --> pick improved or worse
       |
       +-- mock off --> PostHog, last 7 days, or refuse the run
       |
       v
  [1] ANALYST  -- writes a plan -->  [2] BUILDER
                                          |
                            edits the source folder, opens a PR
                                          |
                                          v
                                 [3] MERGE, or wait for a person
                                          |
                    +---------------------+----------------------+
                    |                                            |
                 mock run                                     live run
                    |                                            |
                    v                                            v
             invented after numbers                      status: measuring
                    |                                      checkAfter saved
                    |                                            |
                    |                                            v
                    |                                   python -m agent.check
                    |                                      reads that window
                    |                                            |
                    +---------------------+----------------------+
                                          |
                                          v
                                    [4] REVIEWER
                         KEEP if bounce rate fell by 5 points
                                          |
                            +-------------+-------------+
                            |                           |
                          KEEP                        UNDO
                            |                           |
                            |                    revert PR, then merge it
                            |                           |
                            +-------------+-------------+
                                          |
              mock: the next Start run continues from these numbers
              live: the next Start run reads PostHog again
              both: the Analyst receives the verdict
```

The website saves every step on the Firestore `runs` document. One click is one round. The live check is a later process, not a second click.

## The steps

### 1. Analyst

- **Gets:** the project goal, the source folder's file list, the visitor numbers, and past verdicts for this project.
- **Does:** asks for the files it needs, then picks ONE change. It must not repeat a change a past UNDO already rejected.
- **Hands over:** a plan in the format below.

### 2. Builder

- **Gets:** the plan and the project's `sourceFolder`, from a Daytona clone of that repository.
- **Does:** asks for the files it needs, writes the new file contents, commits, pushes, and opens a pull request against the project's branch. The pull request body includes the plan. Render only hosts this process. It does not edit its own checkout.
- **Auth:** a short-lived GitHub App installation token. The app needs Contents and Pull requests set to Read and write.
- **Rules:** only source files inside the source folder. No dependency files or lockfiles.

### 3. Merge

- The pull request is merged so the site can go live.
- If GitHub reports a conflict, or the branch is behind and cannot be merged, the run pauses with **Needs you**. The agent does not pull or rewrite the branch. You resolve it on GitHub and press **Continue**. Pressing Continue while the conflict is still there leaves the run paused.
- The same pause applies when an undo cannot be merged.

### 4. Reviewer

- **Gets:** the change, the numbers from before, and the numbers from after. Mock numbers are invented at the start. Live numbers are the PostHog window from the change until `checkAfter`.
- **Decides:** KEEP or UNDO from the bounce rate. The site check on the verdict is recorded as OK.
- **If UNDO:** a second pull request reverts the merge, then that pull request is merged too. The reason is stored for the next Analyst run.

## Numbers

Mock data is off unless that user turned it on in Settings.

Mock:

- The first run for a project asks the model for a starting set and saves it on the run.
- The next run for that same project uses the latest saved set. A kept change continues from its after numbers. An undone change continues from its before numbers, because the edit was reverted.
- The Start run dialog picks the after set: improved or worse. Improved pretends the goal was achieved. Worse pretends it was missed.
- The model still has to return numbers that match that choice. Improved must drop bounce rate by at least 5 percentage points and raise the other metrics. Worse must not.

Live PostHog:

- Start run reads the last 7 days and saves that row as `before`. The dialog does not open.
- After the pull request merges, the run stays `measuring` until `checkAfter`. That wait is the hours saved on the user in Settings. The default is 7 days. The shortest is 1 hour and the longest is 14 days. The baseline window stays 7 days. `measuredFrom` is when the wait started, so a later Settings change does not move this run.
- `python -m agent.check` reads PostHog from `measuredFrom` until `checkAfter`, saves `after`, and runs the same KEEP or UNDO rule. One hour of traffic is unlikely to move bounce rate by 5 points, so a demo at the shortest wait should expect UNDO. If the cron runs late, the window stays the one saved on the run.
- The next live Start run reads a new 7-day baseline from PostHog. It does not continue from this run's after numbers. Past verdicts for this project are still given to the Analyst.
- The PostHog project has to be the site the repository deploys. A portfolio PostHog project plus this repo's `demo-site/` measures the portfolio and reverts `demo-site/`.
- A run already saved with an old `checkAfter` does not move when this setting changes. Keep mock data. It is the path that does not wait on PostHog.

## What agents pass to each other

### Plan (Analyst to Builder)

```
problem:          what is going wrong, in one sentence
evidence:         the numbers that show it
change:           the one change to make
file:             which file to edit
expected effect:  what should improve
```

Example:

```
problem:          The hero gives visitors no reason to stay.
evidence:         Mock data. Bounce rate 71%. Average scroll depth 12%.
change:           Add a short benefit list and make the button easier to see.
file:             demo-site/index.html
expected effect:  Bounce rate should fall by at least 5 percentage points.
```

### Verdict (Reviewer, saved for the next Analyst run)

```
decision:         KEEP or UNDO
site check:       OK
numbers before:   bounce rate, scroll depth, time on page, pricing page visits
numbers after:    the same four numbers
reason:           why this decision was made, including the change text
```

## Rules for keep or undo

- KEEP when bounce rate falls by at least 5 percentage points.
- UNDO otherwise.
- The margin lives in `agent/config.py` as `BOUNCE_RATE_DROP`.

## Safety rules

- One change per run, so the next run knows what caused the new numbers.
- Every change is its own commit and its own pull request, so undoing is one revert.
- The Builder only touches source files inside the project's source folder.
- A conflict stops the run for a person. The agent does not pull.
- One active run per user, including `measuring` and `blocked`. Two Daytona sandboxes is the global cap for queued and running work. A measuring run does not take a sandbox until UNDO.
- Mock data stays in the product. The check wait is per user, in Settings, from 1 hour to 14 days, default 7 days.
- Secrets live in `agent/.env` and `web/.env` and are never committed. Git uses the GitHub App, not a personal token.

## What gets recorded

| What                                                        | Where                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every agent run, step by step                               | neatlogs, one trace per round, on the [project home](https://app.neatlogs.com/home?orgId=8ac25f73-a91e-48fa-b5d2-807fcfcec81c&projectId=8d1337ef-31f4-4b33-9770-92d681f9a1b3). That URL is the project home, not a public share of one trace. Share that trace from the dashboard when the link should be public. |
| Each dashboard step, the plan, the numbers, and the verdict | Firestore `runs`                                                                                                                                                                                                                                                                                                  |
| Every change, kept or undone                                | Pull requests on the project's repository                                                                                                                                                                                                                                                                         |
| Reasoning behind a code change                              | Entire checkpoints on the [commits page](https://entire.io/gh/shivam-taneja/friction-fixer/commits)                                                                                                                                                                                                               |
| Business plan for the product                               | cfo.ai, outside this loop. The handoff is in the root README under `cfo.ai`. Do not change the agent or the website to write that plan.                                                                                                                                                                           |
