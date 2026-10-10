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

From this folder:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard is at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
