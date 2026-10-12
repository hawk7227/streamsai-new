// SECURITY (2026-10-12): fails if an environment file or a credential is committed. Runs in CI on every push/PR
// (.github/workflows/secret-scan.yml) and locally: node scripts/secret-scan.mjs
// Prints file and line only — never the matched value. Real keys belong in Vercel → Settings → Environment Variables.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATTERNS = {
  'Stripe secret key': /\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}/,
  'Stripe webhook secret': /\bwhsec_[A-Za-z0-9]{20,}/,
  'JWT / Supabase key': /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  'OpenAI key': /\bsk-(proj-|svcacct-)?[A-Za-z0-9_-]{30,}/,
  'Anthropic key': /\bsk-ant-[A-Za-z0-9_-]{20,}/,
  'Google API key': /\bAIza[0-9A-Za-z_-]{30,}/,
  'GitHub token': /\b(ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{30,}/,
  'Private key': /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  'Mailgun key': /\bkey-[0-9a-f]{32}\b/,
  'AWS key': /\bAKIA[0-9A-Z]{16}\b/,
  'Shopify token': /\bshp(at|ss|ca|pa)_[0-9a-fA-F]{32}\b/,
  'Slack token': /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  'Supabase access token': /\bsbp_[0-9a-f]{40}\b/,
  'ElevenLabs key': /\bsk_[0-9a-f]{40,}\b/,
  'Runway key': /\bkey_[0-9a-f]{64,}\b/,
};
// A quoted literal (or bare NAME=value line) assigned to a name ending in KEY / SECRET / TOKEN / PASSWORD.
const ASSIGNED = [
  /(?:API_?KEY|SECRET|TOKEN|PASSWORD|ACCESS_KEY)["']?\s*[:=]\s*["']([A-Za-z0-9+/_\-]{20,})["']/i,
  /^\s*(?:export\s+)?[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD)\s*=\s*([A-Za-z0-9+/_\-]{20,})\s*$/,
];
const looksSecret = v => /\d/.test(v) && /[a-z]/i.test(v) && !/^[A-Z0-9_]+$/.test(v) && !FAKE.test(v);
// Obvious test/fake values are allowed.
const FAKE = /(x{6,}|0{8,}|1234567|abcdef|abcd1234|fake|dummy|example|placeholder|redacted|changeme|invalid|generate|your[_-]?|test[_-]?key|sk-ant-test|sk-bench|leaktest|not[_-]?a[_-]?real|process\.env|import\.meta\.env|\$\{)/i;
const SKIP = /\.(png|jpe?g|gif|webp|ico|svg|pdf|mp4|mov|mp3|wav|woff2?|ttf|otf|zip|gz|tgz)$|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb)$/;
const SELF = /(^|\/)scripts\/secret-scan\.mjs$/;
const files = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).split('\n').filter(Boolean);
const problems = [];
for (const f of files) {
  const base = f.split('/').pop();
  if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample|template)$/.test(base)) problems.push(`${f}: environment file must not be committed`);
  if (SKIP.test(f) || SELF.test(f)) continue;
  let text; try { text = readFileSync(f, 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue; // binary
  text.split('\n').forEach((line, i) => {
    if (line.length > 5000) return; // minified bundles
    if (/secret-scan:\s*allow/.test(line)) return; // reviewed test value, explicitly allowed on this line
    for (const [name, re] of Object.entries(PATTERNS)) {
      const m = line.match(re);
      if (m && !FAKE.test(m[0])) { problems.push(`${f}:${i + 1}: possible ${name}`); return; }
    }
    for (const re of ASSIGNED) {
      const m = line.match(re);
      if (m && looksSecret(m[1])) { problems.push(`${f}:${i + 1}: possible hard-coded secret value`); return; }
    }
  });
}
if (problems.length) {
  console.error('Secret scan FAILED — move these values to environment variables and rotate any real key:\n' + problems.map(p => '  ' + p).join('\n'));
  process.exit(1);
}
console.log(`Secret scan passed (${files.length} files).`);
