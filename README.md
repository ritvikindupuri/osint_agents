# AURIS — Real-time OSINT intelligence platform powered by autonomous AI agents

AURIS deploys five specialised AI agents that autonomously and continuously scan targets across the open web — no prompting, no clicking, no configuration beyond startup. Social media exposure, network infrastructure, threat intelligence, breach databases, and entity correlation all run in parallel and stream live into a unified intelligence dashboard with a real-time world map, dynamic threat charts, a severity-sorted findings feed, and a terminal log showing each agent's exact reasoning and commands.

Built as a personal OSINT research tool. Your API key never leaves your server — the browser only ever calls your own local Node.js proxy.

→ **[Technical documentation](TECHNICAL.md)** — architecture, agent deep-dives, security model, JSON schema

---

## Key Features

- **Autonomous Multi-Agent System**: Deploys five specialized AI agents (Scout, Trace, Watch, Dig, Link) that automatically and sequentially scan targets without requiring human intervention.
- **Real-Time Unified Dashboard**: Streams live intelligence into a single interface featuring a real-time world map, dynamic threat charts, a severity-sorted findings feed, and detailed agent process logs.
- **Secure Local Proxy Architecture**: The browser interacts exclusively with a local Node.js server. The Anthropic API key is managed purely server-side and is never exposed to the client.
- **Comprehensive Threat Assessment**: Synthesizes social media exposure, network infrastructure mapped data, threat intelligence, and breach data to provide high-confidence attributions and risk postures.
- **Strict Security Measures**: Implements comprehensive server-side security checks including Helmet for security headers, timing-safe CSRF protection, input validation, and rate limiting.

## System Architecture

```mermaid
flowchart TD
    Browser["🖥️ Browser\nAURIS Dashboard\nMap · Pie Chart · Agent Logs · Findings Feed"]

    subgraph Server["Node.js / Express Server"]
        direction TB
        Helmet["Helmet\n12 security headers"]
        RateLimit["Rate Limiter\n60 req / 15 min per IP"]
        CSRF["CSRF Check\ntiming-safe compare"]
        Validation["Input Validation\nwhitelist + type checks"]
        Prompts["Agent System Prompts\nserver-side only — never exposed to browser"]
        EnvKey[".env — ANTHROPIC_API_KEY\nnever sent to client"]
    end

    subgraph Anthropic["Anthropic API — claude-sonnet-4-20250514"]
        direction LR
        Scout["Scout\nSocial media\n& surface web"]
        Trace["Trace\nNetwork &\ninfrastructure"]
        Watch["Watch\nThreat intel\n& IOCs"]
        Dig["Dig\nBreach data\n& dark web"]
        Link["Link\nEntity\ncorrelation"]
    end

    Browser -->|"POST /api/agent\nX-CSRF-Token"| Helmet
    Helmet --> RateLimit --> CSRF --> Validation --> Prompts
    Prompts -->|"system prompt + target\nx-api-key from .env"| EnvKey
    EnvKey --> Scout
    EnvKey --> Trace
    EnvKey --> Watch
    EnvKey --> Dig
    EnvKey --> Link
    Scout -->|"JSON findings"| Browser
    Trace -->|"JSON findings"| Browser
    Watch -->|"JSON findings"| Browser
    Dig -->|"JSON findings"| Browser
    Link -->|"JSON findings"| Browser
```

<div align="center">

*Figure 1 — AURIS three-tier architecture: browser dashboard, Node.js security proxy, and Anthropic agent layer*

</div>

### Request Flow

1. **Browser to Server**: The browser initiates an autonomous or manual scan by sending a POST request (`/api/agent`) containing the target information to the local Node.js server.
2. **Security Middleware**: The request passes through strict security layers: Helmet enforces security headers, a rate limiter prevents abuse, a timing-safe CSRF check verifies authenticity, and input validation ensures the request is well-formed.
3. **Agent Provisioning**: If validated, the server attaches the specific system prompt for the required agent (Scout, Trace, Watch, Dig, or Link) — prompts are kept entirely server-side.
4. **Anthropic API Call**: The server securely injects the Anthropic API key from the local `.env` file and dispatches the request to the Claude model.
5. **Dashboard Update**: The Anthropic API returns a structured JSON intelligence payload. The server proxies this back to the browser, instantly updating the real-time map, charts, process logs, and findings feed.

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
