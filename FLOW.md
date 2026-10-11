# Friction Fixer: How the Loop Works

This file explains what each agent does, what it receives, and what it hands to the next one.

## The loop at a glance

```
  Dashboard: Start run (improved or worse)
       |
       v
  Saved numbers, or a new mock baseline
       |
       v
  [1] ANALYST  -- writes a plan -->  [2] BUILDER
       ^                                  |
       |                    edits the source folder, opens a PR
       |                                  |
       |                                  v
       |                          [3] MERGE, or wait for a person
       |                                  |
       |                                  v
       |                          [4] REVIEWER
       |                          compares mock before and after
       |                                  |
       |                     +------------+------------+
       |                     |                         |
       |                   KEEP                      UNDO
       |                     |                         |
       |                     |                  revert PR, then merge it
       |                     |                         |
       +---------------------+-------------------------+
         the next run starts from these numbers
         and receives the verdict
```

The website saves every step on the Firestore `runs` document. One click is one round.

## The steps

### 1. Analyst

- **Gets:** the project goal, the source folder's file list, mock visitor numbers, and past verdicts.
- **Does:** asks for the files it needs, then picks ONE change. It must not repeat a change a past UNDO already rejected.
- **Hands over:** a plan in the format below.

### 2. Builder

- **Gets:** the plan and the project's `sourceFolder`.
- **Does:** asks for the files it needs, writes the new file contents, commits, pushes, and opens a pull request against the project's branch. The pull request body includes the plan.
- **Auth:** a short-lived GitHub App installation token. The app needs Contents and Pull requests set to Read and write.
- **Rules:** only source files inside the source folder. No dependency files or lockfiles.

### 3. Merge

- The pull request is merged so the site can go live.
- If GitHub reports a conflict, or the branch is behind and cannot be merged, the run pauses with **Needs you**. The agent does not pull or rewrite the branch. You resolve it on GitHub and press **Continue**. Pressing Continue while the conflict is still there leaves the run paused.
- The same pause applies when an undo cannot be merged.

### 4. Reviewer

- **Gets:** the change, the mock numbers from before, and the mock numbers from after.
- **Decides:** KEEP or UNDO from the bounce rate. The site check on the verdict is recorded as OK.
- **If UNDO:** a second pull request reverts the merge, then that pull request is merged too. The reason is stored for the next Analyst run.

## Numbers

Real traffic is too slow for the hackathon, so the numbers are mock and labeled mock.

- The first run for a project asks the model for a starting set and saves it on the run.
- The next run uses the latest saved set. A kept change continues from its after numbers. An undone change continues from its before numbers, because the edit was reverted.
- The Start run dialog picks the after set: improved or worse. Improved pretends the goal was achieved. Worse pretends it was missed.
- The model still has to return numbers that match that choice. Improved must drop bounce rate by at least 5 percentage points and raise the other metrics. Worse must not.

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
- One active run per user. Two Daytona sandboxes is the global cap, when that key is set.
- Secrets live in `agent/.env` and `web/.env` and are never committed. Git uses the GitHub App, not a personal token.

## What gets recorded

| What | Where |
| --- | --- |
| Every agent run, step by step | neatlogs, one trace per round. Share that trace from the dashboard when the link should be public. |
| Each dashboard step, the plan, the numbers, and the verdict | Firestore `runs` |
| Every change, kept or undone | Pull requests on the project's repository |
| Reasoning behind a code change | Entire checkpoints |
| Business plan for the product | cfo.ai |
