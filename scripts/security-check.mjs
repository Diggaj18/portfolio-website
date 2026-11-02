import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = readFileSync('index.html', 'utf8');
const js = readFileSync('script.js', 'utf8');
const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];
assert(csp, 'A Content Security Policy is required');
for (const directive of ["default-src 'none'", "object-src 'none'", "script-src 'self'", "form-action 'none'"]) {
  assert(csp.includes(directive), 'Missing CSP directive: ' + directive);
}
const tags = html.match(/<script\b[^>]*>/gi) || [];
assert(tags.every(tag => /\ssrc\s*=/.test(tag)), 'Inline script tag found');
assert(!/\b(?:eval\s*\(|document\.write\s*\(|\.innerHTML\s*=)/.test(js), 'Potentially unsafe JavaScript sink found');

const tracked = execFileSync('git', ['ls-files', '-z']).toString('utf8').split('\0').filter(Boolean);
const forbiddenPath = /(?:^|\/)(?:\.env(?:\..*)?|\.npmrc|\.pypirc|id_rsa(?:\..*)?|id_ed25519(?:\..*)?|credentials\.json|service-account[^/]*\.json|[^/]*\.(?:pem|p12|pfx|key))$/i;
const ignoredException = /(?:^|\/)\.env\.example$/;
for (const path of tracked) {
  assert(!forbiddenPath.test(path) || ignoredException.test(path), 'Sensitive filename is tracked: ' + path);
}

const patterns = [
  /(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql):\/\/[^\s'"<>]+/i
];
for (const path of tracked) {
  if (!/\.(?:html?|css|js|mjs|cjs|json|ya?ml|md|xml|txt)$/i.test(path)) continue;
  if (statSync(path).size > 2_000_000) continue;
  const data = readFileSync(path, 'utf8');
  assert(!patterns.some(re => re.test(data)), 'Potential credential pattern in: ' + path);
}

console.log('Static policy, JavaScript sinks, and current tracked-file secret checks passed.');
