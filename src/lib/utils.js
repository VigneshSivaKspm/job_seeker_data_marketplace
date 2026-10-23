import { CTC_UNITS, EXP_LEVELS, PROMOS, SOUTH_INDIA, THEMES, daysAgoIso } from './data.js';

/* ------------------------------- HELPERS -------------------------------- */

export const cx = (...a) => a.filter(Boolean).join(' ');
export const round2 = (n) => Math.round(n * 100) / 100;
export const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
export const fmtINR2 = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDateTime = (iso) => `${fmtDate(iso)}, ${new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
export const formatCtc = (c) => (CTC_UNITS[c.ctcUnit] || CTC_UNITS.INR_LPA).fmt(c.ctcAmount);
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
export const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

/* PII masking engine ----------------------------------------------------- */
export const maskName = (name) => name.split(/\s+/).filter(Boolean).map((w) => w[0] + '*'.repeat(Math.max(w.length - 1, 3))).join(' ');

export const maskEmail = (email) => {
  const [local, domain = ''] = email.split('@');
  return `${local[0] || ''}${'*'.repeat(Math.max(local.length - 1, 4))}@${domain}`;
};

export const maskPhone = (phone) => {
  const m = phone.trim().match(/^(\+\d{1,3})\s*(.*)$/);
  const cc = m ? m[1] : '';
  const digits = (m ? m[2] : phone).replace(/\D/g, '');
  if (digits.length < 5) return `${cc} ${'*'.repeat(digits.length)}`.trim();
  return `${cc} ${digits.slice(0, 2)}${'*'.repeat(digits.length - 4)}${digits.slice(-2)}`.trim();
};

/* Pricing ---------------------------------------------------------------- */
export const computePrice = (c, categories, pricing) => {
  const cat = categories.find((x) => x.name === c.industry);
  return Math.max(1, Math.round((pricing.base[c.experience] ?? 0) * (cat ? cat.rarity : 1)));
};

/* Bundles ---------------------------------------------------------------- */
export const matchesBundle = (c, b, categories) => {
  if (b.industryIds) {
    const names = categories.filter((x) => b.industryIds.includes(x.id)).map((x) => x.name);
    if (!names.includes(c.industry)) return false;
  }
  if (b.roles && !b.roles.includes(c.role)) return false;
  if (b.minLevel && EXP_LEVELS.indexOf(c.experience) < EXP_LEVELS.indexOf(b.minLevel)) return false;
  if (b.south && !SOUTH_INDIA.test(c.currentLocation)) return false;
  if (b.notices && !b.notices.includes(c.noticePeriod)) return false;
  return true;
};

/* Export (CSV / Excel) --------------------------------------------------- */
export const EXPORT_COLUMNS = [
  ['Candidate ID', (c) => c.id],
  ['Full Name', (c) => c.name],
  ['Email', (c) => c.email],
  ['Phone', (c) => c.phone],
  ['Current Location', (c) => c.currentLocation],
  ['Preferred Location', (c) => c.preferredLocation],
  ['Industry', (c) => c.industry],
  ['Job Role', (c) => c.role],
  ['Experience Level', (c) => c.experience],
  ['Years of Experience', (c) => c.years],
  ['Education', (c) => c.education],
  ['Key Skills', (c) => c.skills.join('; ')],
  ['Notice Period', (c) => c.noticePeriod],
  ['Expected CTC / Rate', (c) => formatCtc(c)],
  ['Resume / Portfolio', (c) => c.resume],
];

/* Candidate-supplied text ends up in recruiters' spreadsheets: neutralise formula triggers. */
export const safeCell = (v) => {
  const s = String(v ?? '');
  return /^[=@\t\r]/.test(s) || /^[+-](?!\d)/.test(s) ? `'${s}` : s;
};
export const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const buildCsv = (rows) =>
  '﻿' +
  [EXPORT_COLUMNS.map(([h]) => h), ...rows.map((c) => EXPORT_COLUMNS.map(([, f]) => f(c)))]
    .map((r) => r.map((v) => `"${safeCell(v).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

export const buildExcelHtml = (rows) =>
  `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${EXPORT_COLUMNS.map(([h]) => `<th>${escHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((c) => `<tr>${EXPORT_COLUMNS.map(([, f]) => `<td>${escHtml(safeCell(f(c)))}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></body></html>`;

export const downloadFile = (filename, mime, content) => {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* Seed order history ----------------------------------------------------- */
export function buildSeedOrders(cands, cats, pricing) {
  const spec = [
    ['ORD-5001', 'Aditi Sharma', 'TalentBridge HR', 'aditi@talentbridge.example', 'Credit Card', [1001, 1003], 'WELCOME10', 27, 2],
    ['ORD-5002', 'Marcus Lee', 'Northwind Staffing', 'marcus@northwind.example', 'Bank Transfer', [1008, 1009, 1019], 'SAVE15', 19, 1],
    ['ORD-5003', 'Neha Kapoor', 'HireLoop', 'neha@hireloop.example', 'UPI', [1018, 1002], null, 12, 3],
    ['ORD-5004', 'Chris Dawson', 'Apex Recruiters', 'chris@apexrec.example', 'Credit Card', [1007], null, 8, 1],
    ['ORD-5005', 'Aditi Sharma', 'TalentBridge HR', 'aditi@talentbridge.example', 'UPI', [1011, 1014, 1015, 1013], 'HIRE25', 4, 2],
    ['ORD-5006', 'Neha Kapoor', 'HireLoop', 'neha@hireloop.example', 'Credit Card', [1004, 1016], null, 1, 0],
  ];
  const leadOrders = spec
    .map(([id, buyer, company, email, method, nums, code, d, dl]) => {
      const lines = nums.map((n) => {
        const c = cands.find((x) => x.id === `CND-${n}`);
        return { candidateId: c.id, industry: c.industry, role: c.role, price: computePrice(c, cats, pricing) };
      });
      const subtotal = lines.reduce((s, l) => s + l.price, 0);
      const promoDiscount = code ? round2((subtotal * PROMOS[code].pct) / 100) : 0;
      const total = round2(subtotal - promoDiscount);
      const factor = subtotal ? total / subtotal : 1;
      return {
        id, buyer, company, email, method, date: daysAgoIso(d), mine: false,
        items: lines.map((l) => ({ type: 'lead', name: `${l.role} · ${l.candidateId}`, count: 1, price: l.price })),
        lines: lines.map((l) => ({ ...l, paid: round2(l.price * factor) })),
        candidateIds: lines.map((l) => l.candidateId),
        subtotal, bundleSavings: 0, promoCode: code, promoDiscount, total,
        downloads: Array.from({ length: dl }, (_, i) => ({ at: daysAgoIso(Math.max(d - i, 0)), format: i % 2 ? 'Excel' : 'CSV' })),
      };
    });
  const pkgOrder = (id, buyer, company, email, method, name, credits, price, d, dl) => ({
    id, buyer, company, email, method, date: daysAgoIso(d), mine: false, kind: 'package',
    items: [{ type: 'package', name: `${name} · ${credits.toLocaleString('en-IN')} contact credits`, count: credits, price, credits }],
    lines: [], candidateIds: [], credits, creditSpend: price,
    subtotal: price, bundleSavings: 0, promoCode: null, promoDiscount: 0, total: price,
    downloads: Array.from({ length: dl }, (_, i) => ({ at: daysAgoIso(Math.max(d - i, 0)), format: 'CSV' })),
  });
  return [
    ...leadOrders,
    pkgOrder('ORD-5007', 'Neha Kapoor', 'HireLoop', 'neha@hireloop.example', 'UPI', 'Growth', 100, 1000, 15, 0),
    pkgOrder('ORD-5008', 'Priya Menon', 'Talent Forge Consulting', 'priya@talentforge.example', 'Bank Transfer', 'Pro', 500, 4000, 6, 0),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
}



export const themeOf = (categories, industryName) => {
  const cat = categories.find((c) => c.name === industryName);
  return THEMES[cat?.color] || THEMES.indigo;
};

/** 0–100 completeness score for the candidate intake form */
export const profileStrength = (f) => {
  const checks = [
    f.name?.trim().length > 1, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email || ''), (f.phone || '').replace(/\D/g, '').length >= 10,
    !!f.currentLocation?.trim(), !!f.preferredLocation?.trim(), !!f.industry, !!f.role, !!f.experience,
    f.years !== '' && f.years != null, !!f.education, (f.skills || []).length >= 3, !!f.noticePeriod,
    Number(f.ctcAmount) > 0, /^https?:\/\//i.test(f.resume || ''),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

/** Short human label for what an order contains, e.g. "3 leads · 100 credits". */
export const orderSummary = (o) => {
  const parts = [];
  if (o.candidateIds?.length) parts.push(`${o.candidateIds.length} lead${o.candidateIds.length > 1 ? 's' : ''}`);
  if (o.credits) parts.push(`${o.credits.toLocaleString('en-IN')} credits`);
  return parts.join(' · ') || '—';
};