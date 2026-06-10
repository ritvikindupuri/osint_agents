# AURIS — Real-time OSINT intelligence platform powered by autonomous AI agents

AURIS deploys five specialised AI agents that autonomously and continuously scan targets across the open web — no prompting, no clicking, no configuration beyond startup. Social media exposure, network infrastructure, threat intelligence, breach databases, and entity correlation all run in parallel and stream live into a unified intelligence dashboard with a real-time world map, dynamic threat charts, a severity-sorted findings feed, and a terminal log showing each agent's exact reasoning and commands.

Built as a personal OSINT research tool. Your API key never leaves your server — the browser only ever calls your own local Node.js proxy.

→ **[Technical documentation](TECHNICAL.md)** — architecture, agent deep-dives, security model, JSON schema

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js 20, Express 4 |
| Security | Helmet, express-rate-limit, express-validator, Node.js crypto |
| AI | Anthropic API — claude-sonnet-4-20250514 |
| Map | Embedded SVG world map |
| Charts | HTML Canvas |

---

## Setup

This guide assumes Windows with nothing installed. Follow every step exactly.

### 1 — Install Node.js

1. Go to **https://nodejs.org** and click **LTS**
2. Run the `.msi` installer — click Next through everything, keep all defaults
3. Verify: press `Win + R`, type `cmd`, press Enter, then run:
```
node --version
```
You should see `v20.x.x`. If not, restart your computer and try again.

### 2 — Install Git

1. Go to **https://git-scm.com/download/win** — the download starts automatically
2. Run the `.exe` installer — click Next through everything
3. Verify:
```
git --version
```
You should see `git version 2.x.x`.

### 3 — Get your Anthropic API key

1. Go to **https://console.anthropic.com** and sign up or log in
2. Click **API Keys** in the left sidebar → **Create Key** → name it `auris`
3. Copy the key — it starts with `sk-ant-`

> The key is shown once only. Copy it before closing the page.

### 4 — Clone the repository

Open a terminal (`Win + R` → `cmd` → Enter) and run:

```
cd %USERPROFILE%\Desktop
git clone https://github.com/ritvikindupuri/osint_agents.git
cd osint_agents
```

### 5 — Add your API key

```
notepad .env
```

Replace the placeholder with your actual key:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-real-key-here
```

Save (`Ctrl + S`) and close Notepad.

### 6 — Install dependencies

```
npm install
```

Wait for it to finish. Only needed once.

### 7 — Start the server

```
npm start
```

You should see:
```
AURIS → http://localhost:3000  (key loaded: sk-ant-api0...)
```

### 8 — Open the dashboard

Go to **http://localhost:3000** in your browser. Agents start scanning automatically within one second.

---

**To stop:** `Ctrl + C` in the terminal

**To restart:** `cd %USERPROFILE%\Desktop\osint_agents` then `npm start`
