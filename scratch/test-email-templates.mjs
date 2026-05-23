/**
 * Test all email templates — EU region, no emoji, modern design.
 * Usage: node scratch/test-email-templates.mjs your@email.com
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const TO = process.argv[2];
if (!TO) { console.error('Usage: node scratch/test-email-templates.mjs your@email.com'); process.exit(1); }

const API_KEY = process.env.CUSTOMER_IO_API_KEY;
if (!API_KEY) { console.error('CUSTOMER_IO_API_KEY not set'); process.exit(1); }

async function send(subject, html, text) {
  const res = await fetch('https://api-eu.customer.io/v1/send/email', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: TO, from: 'hello@abroaducate.com', subject, body: html, plaintext_body: text })
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// ── Shared styles ────────────────────────────────────────────────────────────
const BASE = `
  <style>
    body { margin:0; padding:0; background:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrap { max-width:600px; margin:0 auto; background:#f1f5f9; padding:32px 16px; }
    .card { background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
    .header { background:#0f172a; padding:28px 32px; text-align:center; }
    .header-logo { color:#ffffff; font-size:22px; font-weight:800; letter-spacing:-0.5px; margin:0; }
    .header-sub { color:#94a3b8; font-size:13px; margin:4px 0 0 0; }
    .body { padding:32px; }
    .footer { padding:20px 32px; text-align:center; }
    .footer a { color:#64748b; font-size:12px; text-decoration:none; }
    .footer a:hover { text-decoration:underline; }
    .btn { display:inline-block; background:#f97316; color:#ffffff; font-weight:700; font-size:15px; padding:14px 32px; border-radius:8px; text-decoration:none; }
    .btn-secondary { display:inline-block; background:#1e40af; color:#ffffff; font-weight:700; font-size:15px; padding:14px 32px; border-radius:8px; text-decoration:none; }
    h1 { color:#0f172a; font-size:22px; font-weight:800; margin:0 0 8px 0; }
    h2 { color:#0f172a; font-size:18px; font-weight:700; margin:0 0 6px 0; }
    p { color:#475569; font-size:15px; line-height:1.6; margin:0 0 16px 0; }
    .divider { border:none; border-top:1px solid #e2e8f0; margin:24px 0; }
    .tag { display:inline-block; background:#f1f5f9; color:#64748b; font-size:11px; font-weight:600; padding:3px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.05em; }
  </style>`;

const FOOTER_HTML = `
  <hr class="divider">
  <div class="footer">
    <a href="https://abroaducate.com/settings">Manage email preferences</a>
    &nbsp;&middot;&nbsp;
    <a href="https://abroaducate.com">abroaducate.com</a>
  </div>`;

// ── SVG icons (inline, email-safe) ───────────────────────────────────────────
const ICON = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  target: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  file: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  award: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  zap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  money: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
};

// ── 1. Scholarship Digest ────────────────────────────────────────────────────
const scholarships = [
  { id: 'erasmus-mundus-2026', title: 'Erasmus Mundus Joint Masters 2026', provider: 'European Commission', amount: '€1,400 / month', deadline: '2026-12-31', field: 'All Fields' },
  { id: 'daad-scholarship', title: 'DAAD Graduate School Scholarship', provider: 'German Academic Exchange Service', amount: '€1,200 / month', deadline: '2026-11-15', field: 'Engineering, Sciences' },
  { id: 'goals-erasmus', title: 'GOALS International Masters Scholarship', provider: 'Erasmus Mundus', amount: 'Full Scholarship + €1,400 Stipend', deadline: '2026-10-30', field: 'All Fields' },
];

const scholarshipCards = scholarships.map(s => `
  <div style="border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:16px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <span class="tag">${s.field}</span>
    </div>
    <h2 style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 4px 0;">${s.title}</h2>
    <p style="color:#64748b;font-size:13px;margin:0 0 12px 0;">${s.provider}</p>
    <div style="display:flex;gap:16px;margin-bottom:14px;">
      <span style="display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:#059669;">${ICON.money} ${s.amount}</span>
      <span style="display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:#dc2626;">${ICON.clock} ${new Date(s.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    </div>
    <a href="https://abroaducate.com/scholarships/${s.id}" style="display:inline-flex;align-items:center;gap:5px;color:#2563eb;font-size:13px;font-weight:600;text-decoration:none;">View scholarship ${ICON.arrow}</a>
  </div>`).join('');

console.log('\n1. Sending Scholarship Digest...');
const r1 = await send(
  `${scholarships.length} new scholarships added this week`,
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${BASE}</head>
  <body><div class="wrap"><div class="card">
    <div class="header">
      <p class="header-logo">Abroaducate</p>
      <p class="header-sub">Your study abroad strategy platform</p>
    </div>
    <div class="body">
      <p class="tag" style="margin-bottom:16px;">Weekly Digest</p>
      <h1>${scholarships.length} new scholarships this week</h1>
      <p>We've added new funding opportunities that match your corridor. Deadlines are approaching — don't miss them.</p>
      <hr class="divider">
      ${scholarshipCards}
      <hr class="divider">
      <div style="text-align:center;padding:8px 0;">
        <a href="https://abroaducate.com/scholarships" class="btn-secondary">Browse all scholarships</a>
      </div>
    </div>
    ${FOOTER_HTML}
  </div></div></body></html>`,
  `Abroaducate — ${scholarships.length} new scholarships this week\n\n${scholarships.map(s => `${s.title}\n${s.provider} · ${s.amount}\nDeadline: ${new Date(s.deadline).toLocaleDateString()}\nhttps://abroaducate.com/scholarships/${s.id}`).join('\n\n')}\n\nBrowse all: https://abroaducate.com/scholarships`
);
console.log(r1.ok ? '  ✅ Sent' : `  ❌ ${r1.status} ${JSON.stringify(r1.json)}`);

// ── 2. Application Deadline Reminder ────────────────────────────────────────
const app = { university: 'TU Munich', program: 'MSc Data Engineering', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
const daysLeft = 7;
const urgencyColor = '#d97706'; // amber for 7 days
const urgencyBg = '#fffbeb';
const urgencyBorder = '#f59e0b';

console.log('\n2. Sending Deadline Reminder (7 days)...');
const r2 = await send(
  `Application deadline in ${daysLeft} days — ${app.university}`,
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${BASE}</head>
  <body><div class="wrap"><div class="card">
    <div class="header">
      <p class="header-logo">Abroaducate</p>
      <p class="header-sub">Application deadline reminder</p>
    </div>
    <div class="body">
      <div style="background:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:8px;padding:16px;margin-bottom:24px;display:flex;align-items:flex-start;gap:12px;">
        <div style="flex-shrink:0;margin-top:2px;">${ICON.zap}</div>
        <div>
          <p style="color:#92400e;font-weight:700;font-size:14px;margin:0 0 2px 0;">Deadline in ${daysLeft} days</p>
          <p style="color:#78350f;font-size:13px;margin:0;">Don't leave your application to the last minute.</p>
        </div>
      </div>
      <h1 style="margin-bottom:4px;">${app.university}</h1>
      <p style="color:#64748b;margin-bottom:24px;">${app.program}</p>
      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:40%;">Deadline</td><td style="padding:8px 0;color:#dc2626;font-weight:700;font-size:14px;">${app.deadline.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Time remaining</td><td style="padding:8px 0;color:#dc2626;font-weight:700;font-size:14px;">${daysLeft} days</td></tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="https://abroaducate.com/dashboard" class="btn">Open my dashboard</a>
      </div>
    </div>
    ${FOOTER_HTML}
  </div></div></body></html>`,
  `Abroaducate — Application deadline in ${daysLeft} days\n\n${app.university} — ${app.program}\nDeadline: ${app.deadline.toLocaleDateString()}\n\nOpen dashboard: https://abroaducate.com/dashboard`
);
console.log(r2.ok ? '  ✅ Sent' : `  ❌ ${r2.status} ${JSON.stringify(r2.json)}`);

// ── 3. Credit Low Warning ────────────────────────────────────────────────────
console.log('\n3. Sending Credit Low Warning (1 credit left)...');
const r3 = await send(
  'You have 1 credit left',
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${BASE}</head>
  <body><div class="wrap"><div class="card">
    <div class="header">
      <p class="header-logo">Abroaducate</p>
      <p class="header-sub">Credit balance update</p>
    </div>
    <div class="body">
      <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px;display:flex;align-items:flex-start;gap:12px;">
        <div style="flex-shrink:0;margin-top:2px;">${ICON.zap}</div>
        <div>
          <p style="color:#92400e;font-weight:700;font-size:14px;margin:0 0 2px 0;">1 credit remaining</p>
          <p style="color:#78350f;font-size:13px;margin:0;">Top up to keep generating strategies and documents.</p>
        </div>
      </div>
      <h1>Top up your credits</h1>
      <p>Credits are used when you generate AI strategies, documents, or run a Right-Fit check. Reading programs and scholarships is always free.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:24px 0;">
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Starter</div>
          <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1;">20</div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">credits</div>
          <div style="font-size:15px;font-weight:700;color:#059669;">$4.99</div>
        </div>
        <div style="border:2px solid #f97316;border-radius:8px;padding:16px;text-align:center;background:#fff7ed;">
          <div style="font-size:12px;font-weight:600;color:#ea580c;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Popular</div>
          <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1;">50</div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">credits</div>
          <div style="font-size:15px;font-weight:700;color:#059669;">$9.99</div>
        </div>
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Elite</div>
          <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1;">130</div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">credits</div>
          <div style="font-size:15px;font-weight:700;color:#059669;">$24.99</div>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="https://abroaducate.com/pricing" class="btn">Top up credits</a>
      </div>
    </div>
    ${FOOTER_HTML}
  </div></div></body></html>`,
  `Abroaducate — 1 credit remaining\n\nTop up to keep generating strategies and documents.\n\nStarter: 20 credits — $4.99\nAccelerator: 50 credits — $9.99\nElite: 130 credits — $24.99\n\nTop up: https://abroaducate.com/pricing`
);
console.log(r3.ok ? '  ✅ Sent' : `  ❌ ${r3.status} ${JSON.stringify(r3.json)}`);

// ── 4. Welcome Email ─────────────────────────────────────────────────────────
const features = [
  { icon: ICON.search, title: 'Browse 2,500+ programs', desc: 'Free — filter by country, field, and tuition. No credits needed.', credit: '' },
  { icon: ICON.award, title: 'Scholarship matching', desc: 'Free — every program shows matched scholarships automatically.', credit: '' },
  { icon: ICON.target, title: 'Right-Fit AI Check', desc: 'See how competitive you are for any program or scholarship.', credit: '1 credit' },
  { icon: ICON.file, title: 'Generate documents', desc: 'SOP, cover letter, personal statement, academic CV — tailored to your target.', credit: '2 credits' },
];

const featureRows = features.map(f => `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;width:28px;">${f.icon}</td>
    <td style="padding:14px 0 14px 12px;border-bottom:1px solid #f1f5f9;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <p style="color:#0f172a;font-weight:700;font-size:14px;margin:0 0 2px 0;">${f.title}</p>
          <p style="color:#64748b;font-size:13px;margin:0;">${f.desc}</p>
        </div>
        ${f.credit ? `<span style="flex-shrink:0;margin-left:12px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;white-space:nowrap;">${f.credit}</span>` : `<span style="flex-shrink:0;margin-left:12px;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;">Free</span>`}
      </div>
    </td>
  </tr>`).join('');

console.log('\n4. Sending Welcome Email...');
const r4 = await send(
  'Welcome to Abroaducate — your 3 free credits are ready',
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${BASE}</head>
  <body><div class="wrap"><div class="card">
    <div class="header">
      <p class="header-logo">Abroaducate</p>
      <p class="header-sub">Your study abroad strategy platform</p>
    </div>
    <div class="body">
      <h1>Welcome — you're all set</h1>
      <p>You've joined 5,000+ students using Abroaducate to find low-tuition programs and scholarships across Europe. You have <strong>3 free credits</strong> to get started.</p>
      <div style="background:#f8fafc;border-radius:8px;padding:4px 16px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          ${featureRows}
        </table>
      </div>
      <p style="color:#64748b;font-size:13px;">Credits are only spent on AI-powered features. Browsing programs, viewing scholarships, and tracking your applications are always free.</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://abroaducate.com/programs" class="btn">Find your program</a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
      <p style="color:#64748b;font-size:13px;margin:0;text-align:center;">Questions? Reply to this email — we read every one.</p>
    </div>
    ${FOOTER_HTML}
  </div></div></body></html>`,
  `Welcome to Abroaducate!\n\nYou have 3 free credits to get started.\n\nWhat you can do:\n- Browse 2,500+ programs (free)\n- Scholarship matching (free)\n- Right-Fit AI Check (1 credit)\n- Generate documents (2 credits)\n\nGet started: https://abroaducate.com/programs\n\nQuestions? Reply to this email.`
);
console.log(r4.ok ? '  ✅ Sent' : `  ❌ ${r4.status} ${JSON.stringify(r4.json)}`);

console.log(`\nDone. Check ${TO} for all 4 redesigned emails.`);
