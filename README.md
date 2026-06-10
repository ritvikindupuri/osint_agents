# AURIS
### Real-time OSINT intelligence platform powered by autonomous AI agents

AURIS is a full-stack web application that deploys five specialised AI agents to autonomously scan targets across the open web — social media, network infrastructure, threat intelligence feeds, breach databases, and entity graphs — and stream findings live to a unified intelligence dashboard. Built for personal security research and OSINT analysis.

---

## System Architecture

```
                        ┌─────────────────────────────────────────┐
                        │              Your Browser                │
                        │                                          │
                        │  ┌──────────────────────────────────┐   │
                        │  │       AURIS Dashboard (UI)        │   │
                        │  │  Map · Pie Chart · Agent Logs     │   │
                        │  │  Findings Feed · Stat Cards       │   │
                        │  └──────────────┬───────────────────┘   │
                        │                 │  POST /api/agent       │
                        │                 │  X-CSRF-Token header   │
                        └─────────────────┼───────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────┐
                        │           Node.js / Express Server       │
                        │                                          │
                        │  ┌────────────┐  ┌────────────────────┐ │
                        │  │   Helmet   │  │   Rate Limiter     │ │
                        │  │ (Headers)  │  │  60 req / 15 min   │ │
                        │  └────────────┘  └────────────────────┘ │
                        │                                          │
                        │  ┌────────────┐  ┌────────────────────┐ │
                        │  │    CSRF    │  │ Input Validation   │ │
                        │  │  Checker   │  │  + Whitelist       │ │
                        │  └────────────┘  └────────────────────┘ │
                        │                                          │
                        │  ┌──────────────────────────────────┐   │
                        │  │       Agent System Prompts        │   │
                        │  │  Scout · Trace · Watch · Dig · Link  │
                        │  │  (server-side only, never exposed)│   │
                        │  └──────────────────────────────────┘   │
                        │                  │                       │
                        │         API Key  │  (from .env only)    │
                        └──────────────────┼───────────────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────────────┐
                        │          Anthropic API                   │
                        │    claude-sonnet-4-20250514              │
                        │                                          │
                        │  ┌────────┐ ┌─────┐ ┌─────┐ ┌──────┐  │
                        │  │ Scout  │ │Trace│ │Watch│ │ Dig  │  │
                        │  └────────┘ └─────┘ └─────┘ └──────┘  │
                        │                   ┌──────┐              │
                        │                   │ Link │              │
                        │                   └──────┘              │
                        └─────────────────────────────────────────┘
```

---

## Architecture Walkthrough

**1. Browser → Server**
The dashboard runs entirely in your browser as a static HTML page served by the Node.js server. When an agent needs to run, the browser sends a `POST /api/agent` request to your own server — it never calls Anthropic directly. Every request carries an `X-CSRF-Token` header to prevent cross-site forgery attacks.

**2. Security middleware stack**
Every request passes through four layers before anything happens. Helmet sets strict HTTP security headers (Content Security Policy, X-Frame-Options, noSniff, and more). The rate limiter caps requests at 60 per 15 minutes per IP to prevent abuse. The CSRF checker compares the token in the cookie against the token in the header using a timing-safe comparison. Input validation checks that the agent index is 0–4, the target only contains safe characters, and the label is either AUTO or MANUAL — anything outside these bounds is rejected with a 400 before it goes further.

**3. Agent system prompts**
Each of the five agents has a detailed system prompt stored on the server — Scout, Trace, Watch, Dig, and Link. These prompts define each agent's OSINT specialisation and instruct the model to return structured JSON. They are never sent to the browser, never visible in source code, and never appear in any network request the browser makes.

**4. API key**
The only place the Anthropic API key exists is in the `.env` file on your machine. The server reads it at startup via an environment variable. It is added to the outgoing request to Anthropic on the server side. It never crosses the network to the browser — not in a header, not in a response, not anywhere.

**5. Anthropic API → Agents**
The server forwards the request to `api.anthropic.com/v1/messages` using the Claude Sonnet model. Each agent receives its system prompt plus the target string and returns structured JSON containing its reasoning, the command it would run, the terminal output, and an array of findings. The server strips everything from the Anthropic response except the content field before sending it back to the browser.

**6. Dashboard updates**
The browser receives the structured findings, parses them, and updates every component in real time — the world map gets a new pulsing marker at the finding's coordinates, the pie chart gains a new slice or increments an existing one, the findings feed prepends the new entry, the stat cards increment, and the agent log shows the full thought process. Agents run autonomously in a loop cycling through targets, and you can also type any target into the input at the bottom to queue a manual scan that runs in parallel without interrupting the loop.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (no frameworks) |
| Backend | Node.js 20, Express 4 |
| Security | Helmet, express-rate-limit, express-validator, crypto (built-in) |
| AI | Anthropic API — claude-sonnet-4-20250514 |
| Map | SVG world map rendered in-browser from geographic path data |
| Charts | HTML Canvas (no chart library) |
| Config | .env file via Node --env-file flag |

---

## Setup Guide

This guide assumes you have a Windows laptop with nothing installed.

### Step 1 — Install Node.js

1. Open your browser and go to **https://nodejs.org**
2. Click the big green button that says **LTS** (the recommended version)
3. Run the downloaded `.msi` file
4. Click Next → Next → Next → Install (keep all defaults)
5. Click Finish when it completes

To verify it worked, press `Win + R`, type `cmd`, press Enter, then type:
```
node --version
```
You should see something like `v20.x.x`. If you do, Node is installed.

---

### Step 2 — Get your Anthropic API key

1. Go to **https://console.anthropic.com**
2. Sign up or log in
3. Click **API Keys** in the left sidebar
4. Click **Create Key**, give it a name like `auris`
5. Copy the key — it starts with `sk-ant-`
6. Save it somewhere temporarily (a notepad, not a screenshot)

---

### Step 3 — Download and unzip the project

1. Download `auris-final.zip` from wherever you saved it
2. Right-click the zip file → **Extract All**
3. Choose a folder, for example `C:\Projects\auris`
4. Click Extract

---

### Step 4 — Add your API key

1. Open the `auris-final` folder
2. Find the file called `.env`
   - If you can't see it, open File Explorer → View → check **Hidden items**
3. Right-click `.env` → Open with → Notepad
4. Replace `sk-ant-api03-replace-with-your-key` with your actual key
5. Save the file (`Ctrl + S`) and close Notepad

The file should look like this:
```
ANTHROPIC_API_KEY=sk-ant-api03-yourrealkeyhere
```

---

### Step 5 — Open a terminal in the project folder

1. Open the `auris-final` folder in File Explorer
2. Click in the address bar at the top of the window (where it shows the path)
3. Type `cmd` and press Enter
4. A black terminal window opens already in the right folder

---

### Step 6 — Install dependencies

In the terminal, type:
```
npm install
```
Press Enter. You will see it downloading packages. Wait until it finishes and you see the cursor again. This only needs to be done once.

---

### Step 7 — Start the server

In the terminal, type:
```
npm start
```
Press Enter. You should see:
```
AURIS → http://localhost:3000  (key loaded: sk-ant-api0...)
```

---

### Step 8 — Open the dashboard

Open your browser and go to:
```
http://localhost:3000
```

The dashboard will load and agents will begin scanning automatically within a second.

---

### Stopping the server

Go back to the terminal window and press `Ctrl + C`. That stops the server.

### Starting it again next time

Open a terminal in the project folder (Step 5) and run `npm start` again. That's it.

---

## Security Notes

- Your API key never leaves your machine
- The browser never calls Anthropic directly — all requests go through your local server first
- Do not commit the `.env` file to GitHub — it is listed in `.gitignore` which prevents this automatically
