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

**Start run** checks the baseline when it is clicked. Mock data opens a dialog for improved or worse. A live PostHog run starts immediately, saves the last 7 days, and waits for the check time from Settings. That wait is 1 hour to 14 days, and the default is 7 days. A run that is already waiting keeps its check time when the setting changes. The run page shows Measuring until `python -m agent.check` keeps or undoes the change. If a pull request conflicts, the run waits on that page until you resolve it on GitHub and press **Continue**.

GitHub and PostHog are connected during onboarding and removed together from Settings. The same email on Google and GitHub is one account. Runs on the dashboard are grouped by project. A removed project stays visible and cannot be continued.

cfo.ai is not this app. Pricing work stays out of `web/`. The handoff is in the root [README](../README.md#cfoai).
