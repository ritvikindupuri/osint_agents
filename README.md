# AURIS — OSINT Intelligence Dashboard

## Setup (60 seconds)

1.  npm install
2.  Add your key to .env  (get one at console.anthropic.com)
3.  npm start
4.  Open http://localhost:3000

Your API key never leaves your machine. The browser only calls /api/agent
on this local server — it never touches Anthropic directly.

## Security included
- Helmet security headers (CSP, HSTS, X-Frame-Options, noSniff, etc.)
- CSRF protection (double-submit cookie, timing-safe compare)
- Rate limiting (60 req / 15 min)
- Input validation + whitelist on all inputs
- 4 KB body limit
- 30s upstream timeout
- Agent system prompts server-side only — never in source or network tab
- API key in .env only — not in any file served to browser
