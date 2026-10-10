# Friction Fixer: How the Loop Works

This file explains what each agent does, what it receives, and what it hands to the next one.

## The loop at a glance

```
  Visitor data
       |
       v
  [1] ANALYST  -- writes a plan -->  [2] BUILDER
       ^                                  |
       |                          edits site, opens PR
       |                                  |
       |                                  v
       |                          [3] MERGE + DEPLOY
       |                                  |
       |                                  v
       |                          [4] REVIEWER
       |                          checks live site + new numbers
       |                                  |
       |                     +------------+------------+
       |                     |                         |
       |                   KEEP                      UNDO
       |                     |                         |
       |                     |                  revert the PR
       |                     |                         |
       +---------------------+-------------------------+
         next round (Analyst gets the result and the reason)
```

## The steps

### 1. Analyst agent

- **Gets:** visitor data (bounce rate, scroll depth, clicks, time on page) and the history of past changes and their results.
- **Does:** works out why visitors are leaving and picks ONE change to try.
- **Hands over:** a plan in the fixed format below.

### 2. Builder agent

- **Gets:** the plan, and the code inside `demo-site/`.
- **Does:** makes the change, saves it as its own commit, and opens a PR that includes the plan in its description.
- **Rules:** only edits files in `demo-site/`. Only makes the one change in the plan.

### 3. Merge and deploy

- The PR is merged into the main branch.
- The hosting service sees the new commit and publishes the updated site by itself.

### 4. Reviewer agent

- **Gets:** the live site, the new visitor data, and the numbers from before the change.
- **Does two checks:**
  1. Does the live page look broken? (missing content, broken layout, dead links)
  2. Did the numbers improve?
- **Decides:** KEEP or UNDO, and writes the reason.
- **If UNDO:** the PR is reverted and the reason goes back to the Analyst.

## What agents pass to each other

### Plan (Analyst to Builder)

```
problem:          what is going wrong, in one sentence
evidence:         the numbers that show it
change:           the one change to make
file:             which file to edit
expected effect:  what should improve, and by roughly how much
```

Example:

```
problem:          Visitors leave the homepage within 5 seconds.
evidence:         Bounce rate 71%. Average scroll depth 12%.
change:           Add basic styling and a clear button linking to the pricing page.
file:             demo-site/index.html and demo-site/style.css
expected effect:  Bounce rate drops below 60%.
```

### Verdict (Reviewer to Analyst)

```
decision:         KEEP or UNDO
site check:       OK or BROKEN (with what is broken)
numbers before:   bounce rate, scroll depth, pricing page visits
numbers after:    same three numbers
reason:           why this decision was made
```

## Rules for keep or undo

- UNDO if the live page is broken, whatever the numbers say.
- UNDO if the main number (bounce rate) got worse.
- KEEP if the page is fine and the main number improved by a clear margin. Pick the margin before you start (for example, at least 5 percent lower) and write it here: \_\_\_\_

## Safety rules

- One change per round, so we know what caused what.
- Every change is its own commit and its own PR, so undoing is one revert.
- The Builder only touches `demo-site/`.
- The loop stops after a set number of rounds (pick one, for example 5) or when the goal number is reached.
- API keys and the GitHub token live in `.env` and are never committed.

## Mock data

Real traffic is too slow for a 48-hour hackathon, so the simulator produces visitor data instead.

- The simulator must react to the agents' changes. If the Builder improves the pricing button, mock visitors should click it more. Otherwise the loop has nothing to learn from.
- Every result from simulated visitors is labeled "mock" in the README and in the demo.
- The site check by the Reviewer is real. Only the visitor numbers are simulated.

## What gets recorded (for the hackathon evidence)

| What                               | Where                   |
| ---------------------------------- | ----------------------- |
| Every agent run, step by step      | neatlogs                |
| Reasoning behind every code change | Entire checkpoints      |
| Every change, kept or undone       | PR history in this repo |
| Business plan for the product      | cfo.ai                  |
