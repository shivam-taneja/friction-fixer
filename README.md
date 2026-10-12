# Friction Fixer

An AI agent that fixes your website by itself.

It looks at how visitors behave, changes the page to fix what is driving them away, then checks if the change helped. If it did not help, the agent undoes the change and tries something else.

Built for [neatHack](https://neatlogs.com/hackathon) (Oct 10-12, 2026).

## The problem

Visitors land on a homepage, scroll a bit, and leave. Someone has to read the analytics, guess what is wrong, edit the page, and wait to see if it worked. This is slow and most small teams never do it.

## How it works

Full details are in [FLOW.md](FLOW.md). In short:

1. You start a run from the dashboard. Mock data asks you to pick improved or worse. A live PostHog run starts immediately.
2. **Analyst** reads the visitor numbers, past verdicts, and the files it asks for, then writes one plan.
3. **Builder** edits the project's source folder, commits, and opens a pull request with the GitHub App.
4. The pull request is merged. If it conflicts, the run waits. You resolve it on GitHub and press **Continue**. The agent does not pull or rewrite the branch.
5. **Reviewer** compares before and after. Bounce rate must fall by at least 5 percentage points to keep the change. Otherwise a second pull request undoes it and is merged too.
6. Mock after-numbers are invented when the run starts. The next mock run for that project continues from the saved set. Live after-numbers come from PostHog after the check wait saved on that user in Settings. The default is 7 days. The shortest wait is 1 hour and the longest is 14 days. `python -m agent.check` does that read. A run that is already waiting keeps the check time it was given. The next live run reads PostHog again for a new 7-day baseline. It does not continue from the previous after numbers. Past verdicts for the same project still go to the Analyst. The next change is another Start run. The loop does not start it by itself.

## Current status

The one-round loop works for mock data and for a connected PostHog project.

Mock data is off until the user turns it on in Settings. When it is off, Start run checks that PostHog has at least one pageview session in the last 7 days, saves that baseline on the run, ships the change, and sets the run to Measuring with a `checkAfter` time. The check command reads PostHog for the window since the change went live, then KEEP or UNDO. If PostHog has no sessions yet, or the request fails, the run stays Measuring and the next check tries again.

Still open, and these are the rest of the core:

- The check command is in the repo. It does nothing in production until this code is on `main` and a Render cron job runs `python -m agent.check`. The cron only notices due runs. The wait is the user's Settings value, saved on the run as `checkAfter` and `measuredFrom`. For a live demo, set the wait to 1 hour and use a cron schedule of `*/5 * * * *`, or run the command by hand once that time has passed.
- Changing the wait in Settings does not move a run that is already Measuring. That run keeps its saved check time. The new wait is used the next time a run is started. Restart `python -m agent.server` after pulling a Python change.
- The PostHog project and the GitHub repository have to be the same site. PostHog on one site and a pull request on another still produces a verdict, and UNDO still reverts the repository, but the numbers are not about the page that changed.
- After KEEP or UNDO, someone starts the next run. `MAX_ROUNDS` in `agent/config.py` is unused.

Overview and Changes exist in the dashboard and are not linked. Leave them unless a task asks for them.

## Already decided

A new session should keep these. They were chosen on purpose.

- Mock data stays. It is off until the user turns it on in Settings. Live PostHog does not replace it.
- The check wait is `users/{userId}.checkAfterHours`. Settings allows 1 through 336 hours. The default, when the field is missing, is 168 (7 days). `agent/config.py` only stores those bounds. It does not schedule the check.
- When a live run merges, it saves `measuredFrom` (that moment) and `checkAfter` (`measuredFrom` plus the user's wait). Changing Settings later does not rewrite those fields. `python -m agent.check` reads PostHog from `measuredFrom` until `checkAfter`. A run saved before `measuredFrom` existed is read over the 7 days ending at `checkAfter`.
- One email is one Friction Fixer account. Google and GitHub with the same email are the same user. The id is the lowercased email.
- After onboarding, GitHub and PostHog are disconnected together from Settings, and they are connected again only by going through onboarding. Disconnecting stops queued, running, blocked, and measuring runs for that project. The run documents stay. The runs page groups them by project id. A disconnected project cannot be continued.
- The PostHog project and the GitHub repository must be the same deployed site. Traffic on one site does not measure an edit to another.
- On UNDO, open a new revert pull request and merge that. Do not close the original pull request.
- On a merge conflict, pause the run. Do not `git pull` and do not rewrite the branch. The person fixes it on GitHub and presses Continue. If they closed the pull request, Continue fails the run.
- The Reviewer does not call the model. KEEP only when bounce rate falls by at least 5 percentage points (`BOUNCE_RATE_DROP`). Scroll, time, and pageviews are recorded and do not decide. `site_check` is `OK`.
- One active run per user. `measuring` and `blocked` hold that lock and do not count toward the Daytona cap. The cap is 2 sandboxes for the whole app, and it applies to queued and running work. UNDO is the only part of the check that opens a sandbox.
- The local agent is `python -m agent.server` on port 8000. Restart it after a Python change. The website on port 3000 calls `AGENT_URL` from its own API routes. The browser does not call Render.
- Do not start the dev server or the agent unless the task asks for it. Do not commit `.env` files, and do not print their values.
- cfo.ai is the business plan, outside this repo. The handoff is [below](#cfoai). Do not add billing to the agent or the website for that work.
- Public indexable pages are `/`, `/privacy`, and `/terms`. `/auth`, `/dashboard`, and `/onboarding` send `noindex`. Unknown URLs return 404. Only `/dashboard` and `/onboarding` redirect to sign-in. Checked 12 Oct 2026. Re-check indexing after the next deploy, then again on 26 Oct 2026 and 9 Nov 2026.
- Do not add FAQPage or HowTo JSON-LD. Google stopped showing those rich results; the FAQ feature was removed from Search documentation in May 2026. Homepage JSON-LD is Organization, WebSite, and WebPage, and it has to match the visible page.
- Sitemap `lastmod` is a real date: homepage `2026-10-10`, privacy and terms `legalModified` in `web/src/lib/seo.ts` (`2026-10-12`). Do not add `changefreq` or `priority`. Google ignores both.
- Collapsed FAQ answers and workflow step descriptions stay in the HTML. The homepage “−6 pts” line is a product illustration, not a published result.
- This audit had no Search Console or Keyword Planner access. Do not invent rankings or search volume.

## Where it runs

- The public site is [friction-fixer.shivamtaneja.com](https://friction-fixer.shivamtaneja.com). The website is the Next.js app in `web/`. **Start run** calls a Next.js route, and that route calls the agent with `AGENT_SECRET`. The browser does not call Render.
- PostHog's OAuth client id is `https://friction-fixer.shivamtaneja.com/api/posthog/client`. That URL has to be the deployed site. Localhost is only the redirect.
- The agent is a Render web service. Build `pip install -r agent/requirements.txt`, start `python -m agent.server`, Python 3.13, health check `/`. Root directory stays empty. The live service is [friction-fixer.onrender.com](https://friction-fixer.onrender.com).
- The live check is a separate Render cron job, same build command, command `python -m agent.check`, region Singapore. It needs `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and `DAYTONA_API_KEY` from the agent service. It does not need `AGENT_SECRET`, the LLM keys, or `PYTHON_VERSION` unless a build fails on the wrong Python. Leave `PYTHON_VERSION` unset so it matches the web service. The cheapest instance is enough. The cron does not inherit the web service's environment.
- Each round is one neatlogs trace, workflow `friction-fix-round`. The agent sends it to `https://ingest.neatlogs.com`. Traces are on the [project home](https://app.neatlogs.com/home?orgId=8ac25f73-a91e-48fa-b5d2-807fcfcec81c&projectId=8d1337ef-31f4-4b33-9770-92d681f9a1b3). That URL is the project home. A public link is a share of one trace. The code does not publish one.
- Daytona is where the edit happens. Each run clones that user's repository into a sandbox, changes the source folder there, and pushes the pull request from that clone. Render only runs the agent process. A new run is refused while two sandboxes are already open.
- Entire records the Cursor sessions that built this repo. It is not called by the agent loop. Every checkpoint is listed on the [commits page](https://entire.io/gh/shivam-taneja/friction-fixer/commits). After `git push`, a checkpoint opens at `https://entire.io/gh/shivam-taneja/friction-fixer/commit/<commit-sha>` when that commit has an `Entire-Checkpoint` trailer.

## Project structure

- `agent/` — the Python loop. The deployed process is `python -m agent.server`.
- `demo-site/` — the sample site. A project edits whatever folder it saved as `sourceFolder`.
- `web/` — the marketing site and the dashboard. How to run it is in [web/README.md](web/README.md).
- `FLOW.md` — what each agent receives and hands on.
- `agent/.env` — agent API keys, the GitHub App, and Firebase Admin. Copy from `agent/.env.example`. Never commit this file.
- `web/.env` — Firebase, the GitHub App, and the agent URL and secret. Copy from `web/.env.example`. Never commit this file.
- `.python-version` — tells pyenv to use Python 3.13 in this folder only.

## Setup

Python **3.13** is required. `neatlogs` does not install on 3.14. The `.python-version` file in this repo is set to `3.13`, so this project uses 3.13 and the rest of your machine stays on whatever global version you already have.

You also need git, and a virtualenv named `venv` in the repo root. `venv/` is gitignored.

Fill in `agent/.env` after you copy it. It needs `NEATLOGS_API_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `LLM_PROVIDER`, that provider's API key, `AGENT_SECRET`, and the Firebase service account fields. The GitHub App id and private key match the website. The app needs **Contents** and **Pull requests** set to **Read and write**.

The site uses `web/.env`. It needs the Firebase keys, `COOKIE_SECRET_KEY`, the GitHub App (`GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_PRIVATE_KEY`), `AGENT_URL`, and the same `AGENT_SECRET`.

The website starts a round. The deployed process is `python -m agent.server`, which calls `run(case, user_id, run_id)` in `agent/loop.py`. A live run passes `case` as `live`. Render builds with `pip install -r agent/requirements.txt`, starts with `python -m agent.server`, and uses Python 3.13. The service root stays the repo root. The health check path is `/`. The check job is `python -m agent.check`.

### Mac

Install [Homebrew](https://brew.sh), then pyenv:

```bash
brew install pyenv
```

Add this to `~/.zshrc`, then open a new terminal:

```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - zsh)"
```

From the repo root:

```bash
pyenv install 3.13
python --version
python -m venv venv
source venv/bin/activate
pip install -r agent/requirements.txt
cp agent/.env.example agent/.env
```

`python --version` should print `3.13.x`.

### Windows

Install [pyenv-win](https://github.com/pyenv-win/pyenv-win) in PowerShell:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"; &"./install-pyenv-win.ps1"
```

Close the terminal and open a new one. pyenv-win needs a full version number, so install one and write that exact version into `.python-version` (for example `3.13.2`):

```powershell
pyenv install -l
pyenv install 3.13.2
cd path\to\friction-fixer
python --version
python -m venv venv
venv\Scripts\activate
pip install -r agent/requirements.txt
copy agent\.env.example agent\.env
```

`python --version` should print `3.13.x`.

## Tools used

- **neatlogs:** records every agent run so failures can be found and fixed.
- **Entire:** saves the reasoning behind every code change as checkpoints.
- **cfo.ai:** the business plan for Friction Fixer as a product. It is written outside this loop. See [cfo.ai](#cfoai) before changing anything for it.

## Evidence

- neatlogs traces: [traces page](https://app.neatlogs.com/traces?orgId=8ac25f73-a91e-48fa-b5d2-807fcfcec81c&projectId=8d1337ef-31f4-4b33-9770-92d681f9a1b3)
- Failed run, 11 Oct 2026, 10:23 PM IST. The builder stopped with "Failed to create branch: worktree contains unstaged changes." [Trace](https://app.neatlogs.com/traces/d4b403f52944e659e8e361789850bf0f?orgId=8ac25f73-a91e-48fa-b5d2-807fcfcec81c&projectId=8d1337ef-31f4-4b33-9770-92d681f9a1b3)
- Live run from the demo: [trace](https://app.neatlogs.com/traces/f2ea4bb55e9a0cebdc1f8fc976c2587b?orgId=8ac25f73-a91e-48fa-b5d2-807fcfcec81c&projectId=8d1337ef-31f4-4b33-9770-92d681f9a1b3)
- Undo pull request: https://github.com/shivam-taneja/friction-fixer/pull/10
- Entire checkpoints: [commits page](https://entire.io/gh/shivam-taneja/friction-fixer/commits)
- cfo.ai business plan: https://cfo.ai/s/-4awsVQMI2SYSj-n
- Demo video: https://x.com/codesbyshivam/status/2109685055551619370
- #neatHack post: https://x.com/codesbyshivam/status/2109685055551619370

## cfo.ai

This is a separate piece of work. An agent doing the business plan should not change `agent/` or `web/` unless a broken product fact in this file has to be corrected.

cfo.ai is where the pricing, cost, and revenue plan for Friction Fixer is written. The plan does not live in this repository. The public share is https://cfo.ai/s/-4awsVQMI2SYSj-n. It opens the plan for three verified website-edit trials and whether one of them becomes a paying Pro customer. Keep that URL when those pages change. A new page belongs in that same share.

The plan has to match the product as it works now:

- One person connects one GitHub repository and one PostHog project. After setup, those two connections are removed together, and that removal stops runs for that project. Signing in with the same email on Google and GitHub is one Friction Fixer account.
- Mock mode invents the outcome at the start. Live mode saves the last 7 days from PostHog, ships one change, waits the hours saved on that user, then reads PostHog again. The default is 7 days. Settings allows 1 hour through 14 days. KEEP only when bounce rate falls by at least 5 percentage points. Otherwise the change is reverted in a new pull request.
- The costs to account for are the Analyst and Builder model calls, Daytona (at most two sandboxes open for the whole app), the Render web service, and the Render cron job. PostHog and GitHub are the customer's own accounts. There is no billing, Stripe, plan, or usage meter in this repo.
- Do not invent vendor prices. Use each vendor's current public pricing. A 7-day wait matches the baseline window. A 1-hour wait is something a user can choose in Settings for a demo. Runs already scheduled keep the wait they were given.

Leave the agent loop alone. The business plan is not a new status, a new screen, or a change to the keep rule.
