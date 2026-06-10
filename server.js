import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error('Set ANTHROPIC_API_KEY in .env'); process.exit(1); }

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc:["'self'"], scriptSrc:["'self'"], styleSrc:["'self'","'unsafe-inline'"], connectSrc:["'self'"], imgSrc:["'self'","data:"], frameAncestors:["'none'"] } } }));
app.use(express.json({ limit: '4kb' }));
app.use(cookieParser());

app.use(rateLimit({ windowMs: 15*60*1000, max: 60, message: { error: 'Rate limit hit.' } }));

// CSRF
app.use((req, res, next) => {
  if (!req.cookies?._csrf) {
    const t = crypto.randomBytes(32).toString('hex');
    res.cookie('_csrf', t, { httpOnly: false, sameSite: 'strict', maxAge: 86400000 });
    res.locals.csrf = t;
  } else { res.locals.csrf = req.cookies._csrf; }
  next();
});
function checkCsrf(req, res, next) {
  const a = req.cookies?._csrf, b = req.headers['x-csrf-token'];
  if (!a || !b || a.length !== b.length) return res.status(403).json({ error: 'Bad CSRF' });
  try { if (!crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))) return res.status(403).json({ error: 'Bad CSRF' }); } catch { return res.status(403).json({ error: 'Bad CSRF' }); }
  next();
}

// Agent prompts — server only, never exposed to browser
function sys(role, spec) {
  return `You are ${role}, an OSINT agent. ${spec}\nReply with ONLY valid JSON, no markdown:\n{"thought":"...","command":"...","output":"...","findings":[{"type":"Phishing|Malware|C2|Leaked Creds|Exposure|APT|Brute-force|Reconnaissance|Data Breach|Open Port|Certificate|Disinformation","severity":"High|Medium|Low","summary":"one sentence","location":"City, Country","lat":null,"lon":null,"threat":null,"threatActor":null,"threatActorDesc":null,"threatActorDetail":null}]}`;
}
const AGENTS = [
  sys('Scout',  'Social media, surface web, brand impersonation, phishing detection.'),
  sys('Trace',  'Network infra, DNS, certificate transparency, ASN, Shodan/Censys.'),
  sys('Watch',  'Threat intel, IOC analysis, CVE lookup, MITRE ATT&CK, threat actors.'),
  sys('Dig',    'Data breaches, credential leaks, paste sites, dark web exposure.'),
  sys('Link',   'Entity correlation, attribution, final threat assessment.'),
];

app.get('/api/csrf', (req, res) => res.json({ token: res.locals.csrf }));

app.post('/api/agent',
  checkCsrf,
  [body('agentIndex').isInt({min:0,max:4}), body('target').isString().trim().isLength({min:1,max:253}).matches(/^[a-zA-Z0-9._\-@:/\s]+$/), body('label').isIn(['AUTO','MANUAL'])],
  async (req, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Bad input.' });
    const { agentIndex, target, label } = req.body;
    console.log(`[${new Date().toISOString()}] agent=${agentIndex} label=${label}`);
    try {
      const up = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key': KEY, 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system:AGENTS[agentIndex], messages:[{role:'user',content:`Target: ${target}\nRun OSINT sweep. Be specific.`}] }),
        signal: AbortSignal.timeout(30000),
      });
      if (!up.ok) { console.error('Upstream', up.status); return res.status(502).json({ error: 'Upstream error.' }); }
      const d = await up.json();
      res.json({ content: d.content });
    } catch(e) {
      if (e.name === 'TimeoutError') return res.status(504).json({ error: 'Timeout.' });
      console.error(e.message);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

app.use(express.static(path.join(__dirname, 'public'), { setHeaders: r => r.setHeader('Cache-Control','no-store') }));
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, _n) => { console.error(err.message); res.status(500).json({ error: 'Error.' }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AURIS → http://localhost:${PORT}  (key loaded: ${KEY.slice(0,12)}...)`));
