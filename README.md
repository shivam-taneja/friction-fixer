# Friction Fixer

An AI agent that fixes your website by itself.

It looks at how visitors behave, changes the page to fix what is driving them away, then checks if the change helped. If it did not help, the agent undoes the change and tries something else.

Built for [neatHack](https://neatlogs.com/hackathon) (Oct 10-12, 2026).

## The problem

Visitors land on a homepage, scroll a bit, and leave. Someone has to read the analytics, guess what is wrong, edit the page, and wait to see if it worked. This is slow and most small teams never do it.

## How it works

Full details are in [FLOW.md](FLOW.md). In short:

1. **Analyst agent** reads the visitor data and writes a plan: what is wrong and one change to try.
2. **Builder agent** reads the plan, edits the site, and opens a pull request (PR).
3. The PR is merged and the site goes live automatically.
4. **Reviewer agent** checks the live site and the new numbers, then decides: keep the change or undo it.
5. If undone, the reason goes back to the Analyst, who tries a different idea.

## Current status

The goal right now is a complete, working loop. Because real traffic takes too long to collect in a 48-hour hackathon, the agent is currently fed **mock visitor data**.

## Project structure

- `agent/` — Python agents that run the loop. Files are placeholders.
- `demo-site/` — the site the Builder is allowed to edit.
- `FLOW.md` — what each agent receives and hands on.
- `.env` — API keys and the GitHub token. Copy from `.env.example`. Never commit this file.
- `.python-version` — tells pyenv to use Python 3.13 in this folder only.

## Setup

Python **3.13** is required. `neatlogs` does not install on 3.14. The `.python-version` file in this repo is set to `3.13`, so this project uses 3.13 and the rest of your machine stays on whatever global version you already have.

You also need git, and a virtualenv named `venv` in the repo root. `venv/` is gitignored.

Fill in `.env` after you copy it. It needs `NEATLOGS_API_KEY`, `GITHUB_TOKEN`, and `OPENAI_API_KEY`.

Run the loop from the repo root, with the virtualenv activated:

```bash
python -m agent
```

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
cp .env.example .env
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
copy .env.example .env
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
