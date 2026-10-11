# Friction Fixer

An AI agent that fixes your website by itself.

It looks at how visitors behave, changes the page to fix what is driving them away, then checks if the change helped. If it did not help, the agent undoes the change and tries something else.

Built for [neatHack](https://neatlogs.com/hackathon) (Oct 10-12, 2026).

## The problem

Visitors land on a homepage, scroll a bit, and leave. Someone has to read the analytics, guess what is wrong, edit the page, and wait to see if it worked. This is slow and most small teams never do it.

## How it works

Full details are in [FLOW.md](FLOW.md). In short:

1. You start a run from the dashboard and pick the mock outcome: improved or worse.
2. **Analyst** reads the saved visitor numbers, past verdicts, and the files it asks for, then writes one plan.
3. **Builder** edits the project's source folder, commits, and opens a pull request with the GitHub App.
4. The pull request is merged. If it conflicts, the run waits. You resolve it on GitHub and press **Continue**. The agent does not pull or rewrite the branch.
5. **Reviewer** compares the mock numbers. Bounce rate must fall by at least 5 percentage points to keep the change. Otherwise a second pull request undoes it and is merged too.
6. The next run starts from those saved numbers. A first project generates the starting set.

## Current status

The loop runs from the website through the deployed agent. Visitor numbers are still **mock**. A first run creates them. Later runs reuse the latest saved set in Firestore. Real analytics (PostHog) is later.

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

The website starts a round. The deployed process is `python -m agent.server`, which calls `run(case, user_id, run_id)` in `agent/loop.py`. Render builds with `pip install -r agent/requirements.txt`, starts with `python -m agent.server`, and uses Python 3.13. The service root stays the repo root. The health check path is `/`.

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
- **cfo.ai:** used to plan pricing, costs and revenue for Friction Fixer as a product.

## Evidence

- neatlogs traces, before vs after improving the agent: _link_
- A run where the agent's change failed and it undid it: _link_
- Website results, before vs after (mock data): _numbers_
- Entire checkpoints: _link or screenshot_
- cfo.ai business plan: _link_
- Demo video: _link_
- Posts shared while building (#neatHack): _links_
