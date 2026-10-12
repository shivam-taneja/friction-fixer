# Web

The Friction Fixer marketing site (`/`) and dashboard (`/dashboard`).

This folder requires [pnpm](https://pnpm.io) **10.33.0** and Node.js **20.9** or newer.

## Mac

Install [Homebrew](https://brew.sh) if you do not have it, then Node.js:

```bash
brew install node
```

`node --version` should print `v20.9` or newer.

Install pnpm 10.33.0:

```bash
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=10.33.0 sh -
```

Close the terminal and open a new one. `pnpm --version` should print `10.33.0`.

## Windows

Install Node.js 20.9 or newer from [nodejs.org](https://nodejs.org). Close the terminal and open a new one. `node --version` should print `v20.9` or newer.

Windows Defender can block the standalone pnpm installer, so install pnpm with npm. In PowerShell:

```powershell
npm install -g pnpm@10.33.0
```

`pnpm --version` should print `10.33.0`.

## Run

From this folder, copy `.env.example` to `.env` and fill it in. It is never committed. The agent uses a separate file, `agent/.env`.

The website file needs:

- Firebase public keys and the Firebase Admin service account
- `COOKIE_SECRET_KEY`
- `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, and `GITHUB_APP_PRIVATE_KEY`
- `AGENT_URL` and `AGENT_SECRET` (the same secret as the agent)

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard is at [http://localhost:3000/dashboard](http://localhost:3000/dashboard). Runs are at [http://localhost:3000/dashboard/runs](http://localhost:3000/dashboard/runs).

The browser calls this app's API routes. Those routes call `AGENT_URL` with `AGENT_SECRET`. A local agent is `python -m agent.server` on port 8000. Leave both servers stopped unless the task asks to run them.

**Start run** checks the baseline when it is clicked, not when the page loads. Mock data opens a dialog for improved or worse. Keep that dialog. A live PostHog run starts immediately, saves the last 7 days, and waits for the check time from Settings. That wait is stored as `checkAfterHours` on the user: 1 hour to 14 days, default 7 days. A run that is already waiting keeps its check time when the setting changes. The run page shows Measuring until `python -m agent.check` keeps or undoes the change. If a pull request conflicts, the run waits on that page until you resolve it on GitHub and press **Continue**. Closing that pull request makes Continue fail the run.

GitHub and PostHog are connected during onboarding and removed together from Settings. After setup, connecting or disconnecting only one of them is refused. The same email on Google and GitHub is one account. Runs on the dashboard are grouped by project id. The heading is the repository. A second line shows the branch and when that project was connected, so two groups with the same repository stay distinct. A removed project stays visible and cannot be continued. Disconnecting stops a queued, running, blocked, or measuring run.

Settings also has the mock toggle and the check wait. Errors from Start run use the `notify` toast wrapper. Overview and Changes are unused screens. Their sidebar links stay commented out.

`/pricing` shows the Free, Pro, top-up, Team, and custom plans. Checkout is not wired. A signed-out visitor who clicks a plan goes to `/auth`. A signed-in visitor gets a Coming soon toast. Do not charge anyone from this page until Dodo Payments is connected.

cfo.ai is not this app. The plan behind these prices is written there. The handoff is in the root [README](../README.md#cfoai). The decisions a new session must keep are in that same file under **Already decided**.
