import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Briefcase, Check, CircleCheck, Clock, Copy, Eye, FileCheck2, GraduationCap, Lock,
  Mail, MapPin, Pencil, Phone, Rocket, Search, ShieldCheck, Sparkles, Store, Unlock, UserCheck, Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { CTC_UNITS, EDUCATION_LEVELS, EXP_INFO, EXP_LEVELS, NOTICE_PERIODS, THEMES } from '../lib/data.js';
import { EMPTY_FORM, toCandidateData, validateCandidate } from '../lib/forms.js';
import { cx, fmtDate, maskEmail, maskName, maskPhone, profileStrength } from '../lib/utils.js';
import { Badge, Btn, Field, IndustryTile, SelectInput, TextInput } from '../components/ui.jsx';
import { SkillsInput, suggestionsFor } from '../components/CandidateFields.jsx';

const STEPS = [
  { label: 'About you', hint: 'How recruiters reach you', icon: UserCheck },
  { label: 'Your career', hint: 'Role, skills & experience', icon: Briefcase },
  { label: 'Job search', hint: 'Availability & pay', icon: Rocket },
  { label: 'Review', hint: 'Check & submit', icon: ShieldCheck },
];

const NOTICE_INFO = {
  Immediate: { sub: 'Ready to start now', tone: 'from-emerald-500 to-teal-500' },
  '15 Days': { sub: 'Short handover', tone: 'from-sky-500 to-blue-500' },
  '30 Days': { sub: 'Standard notice', tone: 'from-indigo-500 to-violet-500' },
  '60+ Days': { sub: 'Longer commitment', tone: 'from-amber-500 to-orange-500' },
};

/* ------------------------- strength ring + preview ------------------------ */

function StrengthRing({ value, size = 64 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/20" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#sg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-all duration-700" />
        <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#6ee7b7" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-white">{value}%</div>
    </div>
  );
}

function ProfilePreview({ form, categories, dark }) {
  const filled = (v, fallback) => (v && String(v).trim() ? v : fallback);
  const theme = THEMES[categories.find((c) => c.name === form.industry)?.color] || THEMES.indigo;
  const masked = form.name.trim() ? maskName(form.name) : '• • • • •  • • • •';
  const ini = form.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  const ctc = form.ctcAmount ? CTC_UNITS[form.ctcUnit].fmt(form.ctcAmount) : '—';
  return (
    <div className={cx('rounded-3xl p-5 shadow-2xl', dark ? 'bg-white text-slate-900 shadow-black/20' : 'bg-white text-slate-900 shadow-card ring-1 ring-slate-200')}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">How recruiters see you</span>
        <Badge tone="slate" icon={Lock}>Masked</Badge>
      </div>
      <div className="flex items-center gap-3.5">
        <div className={cx('flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-extrabold text-white shadow-md transition-all duration-500', theme.grad)}>{ini}</div>
        <div className="min-w-0">
          <div className="truncate font-mono text-base font-bold tracking-wide">{masked}</div>
          <div className="truncate text-sm font-bold text-indigo-600">{filled(form.role, 'Your job role')}</div>
        </div>
      </div>
      <div className="mt-4 space-y-1.5 font-mono text-xs text-slate-500">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"><Mail size={12} className="text-slate-400" /><span className="truncate">{form.email.includes('@') ? maskEmail(form.email) : '••••••@•••••.com'}</span></div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"><Phone size={12} className="text-slate-400" /><span>{form.phone.replace(/\D/g, '').length >= 5 ? maskPhone(form.phone) : '+•• ••••••••••'}</span></div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[['Level', form.experience || '—'], ['Notice', form.noticePeriod || '—'], ['Expected', ctc]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-brand-soft px-1.5 py-2"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{k}</div><div className="truncate text-xs font-extrabold text-slate-800">{v}</div></div>
        ))}
      </div>
      <div className="mt-3 flex min-h-[26px] flex-wrap gap-1.5">
        {form.skills.length ? form.skills.slice(0, 6).map((s) => <span key={s} className={cx('rounded-lg px-2 py-1 text-[11px] font-bold', theme.soft)}>{s}</span>) : <span className="text-xs text-slate-400">Your skills will appear here</span>}
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500"><MapPin size={12} />{filled(form.currentLocation, 'Current location')}{form.preferredLocation && <> → {form.preferredLocation}</>}</div>
    </div>
  );
}

/* ------------------------------- step views ------------------------------ */

function StepHeader({ n, title, text }) {
  return (
    <div className="mb-7">
      <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500">Step {n} of 4</div>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
      <p className="mt-1.5 text-slate-500">{text}</p>
    </div>
  );
}

function StepAbout({ f, set, errors }) {
  return (
    <>
      <StepHeader n={1} title="Let's start with you" text="Recruiters never see these contact details until they unlock your profile." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name}><TextInput autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} error={errors.name} autoComplete="name" placeholder="e.g. Priya Nair" /></Field>
        <Field label="Email address" required error={errors.email}><TextInput type="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={errors.email} autoComplete="email" placeholder="you@example.com" /></Field>
        <Field label="Phone number" required error={errors.phone} hint="Include country code, e.g. +91 98765 43210"><TextInput type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} autoComplete="tel" placeholder="+91 98765 43210" /></Field>
        <div className="hidden sm:block" />
        <Field label="Where are you based?" required error={errors.currentLocation}><TextInput placeholder="City, State / Country" value={f.currentLocation} onChange={(e) => set('currentLocation', e.target.value)} error={errors.currentLocation} /></Field>
        <Field label="Preferred work location" required error={errors.preferredLocation}><TextInput placeholder="e.g. Bengaluru / Remote" value={f.preferredLocation} onChange={(e) => set('preferredLocation', e.target.value)} error={errors.preferredLocation} /></Field>
      </div>
    </>
  );
}

function StepCareer({ f, set, errors, categories }) {
  const cat = categories.find((c) => c.name === f.industry);
  return (
    <>
      <StepHeader n={2} title="Tell us about your career" text="This is what recruiters search on — the more precise, the better your matches." />
      <Field label="Which industry are you in?" required error={errors.industry} as="div">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {categories.map((c) => {
            const on = f.industry === c.name;
            return (
              <button key={c.id} type="button" onClick={() => { set('industry', c.name); set('role', ''); }}
                className={cx('group flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition', on ? 'border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-500/10' : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-soft')}>
                <div className="flex w-full items-center justify-between">
                  <IndustryTile cat={c} size="h-10 w-10" iconSize={18} />
                  {on && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><Check size={13} strokeWidth={3} /></span>}
                </div>
                <span className="text-sm font-extrabold leading-tight text-slate-900">{c.name}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {cat && (
        <Field label="What's your primary role?" required error={errors.role} as="div" className="mt-7">
          <div className="flex flex-wrap gap-2">
            {cat.roles.map((r) => (
              <button key={r} type="button" onClick={() => set('role', r)}
                className={cx('rounded-full px-4 py-2.5 text-sm font-bold transition', f.role === r ? 'bg-brand text-white shadow-md shadow-indigo-500/25' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:ring-indigo-300')}>{r}</button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Experience level" required error={errors.experience} as="div" className="mt-7">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {EXP_LEVELS.map((l) => {
            const on = f.experience === l;
            return (
              <button key={l} type="button" onClick={() => set('experience', l)}
                className={cx('rounded-2xl border-2 p-4 text-left transition', on ? 'border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-500/10' : 'border-slate-200 bg-white hover:border-indigo-200')}>
                <div className="text-base font-extrabold text-slate-900">{l}</div>
                <div className="text-xs font-bold text-indigo-600">{EXP_INFO[l].years}</div>
                <div className="mt-1 text-[11px] leading-snug text-slate-500">{EXP_INFO[l].blurb}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Total years of experience" required error={errors.years}><TextInput type="number" inputMode="numeric" min="0" max="50" value={f.years} onChange={(e) => set('years', e.target.value)} error={errors.years} placeholder="e.g. 6" /></Field>
        <Field label="Highest education" required error={errors.education}>
          <SelectInput value={f.education} error={errors.education} onChange={(e) => set('education', e.target.value)}>
            <option value="">Select education</option>
            {EDUCATION_LEVELS.map((x) => <option key={x}>{x}</option>)}
          </SelectInput>
        </Field>
      </div>

      <Field label="Key skills" required as="div" className="mt-7" hint="Add 3 or more — they power your matches. Up to 15." error={errors.skills ? undefined : undefined}>
        <SkillsInput value={f.skills} onChange={(v) => set('skills', v)} error={errors.skills} suggestions={suggestionsFor(categories, f.industry)} />
      </Field>
    </>
  );
}

function StepSearch({ f, set, errors }) {
  return (
    <>
      <StepHeader n={3} title="Your job search" text="Help recruiters know when you can start and what you're looking for." />
      <Field label="How soon can you join?" required error={errors.noticePeriod} as="div">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {NOTICE_PERIODS.map((n) => {
            const on = f.noticePeriod === n;
            return (
              <button key={n} type="button" onClick={() => set('noticePeriod', n)}
                className={cx('relative overflow-hidden rounded-2xl border-2 p-4 text-left transition', on ? 'border-transparent text-white shadow-lg' : 'border-slate-200 bg-white hover:border-indigo-200')}>
                {on && <div className={cx('absolute inset-0 bg-gradient-to-br', NOTICE_INFO[n].tone)} />}
                <div className="relative">
                  <Clock size={18} className={on ? 'text-white/80' : 'text-slate-400'} />
                  <div className={cx('mt-2 text-base font-extrabold', on ? 'text-white' : 'text-slate-900')}>{n}</div>
                  <div className={cx('text-[11px]', on ? 'text-white/80' : 'text-slate-500')}>{NOTICE_INFO[n].sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <div className="mt-7">
        <Field label="Expected pay" required error={errors.ctcAmount} as="div">
          <div className="mb-3 inline-flex rounded-full bg-slate-100 p-1">
            {Object.entries(CTC_UNITS).map(([k, u]) => (
              <button key={k} type="button" onClick={() => set('ctcUnit', k)} className={cx('rounded-full px-4 py-2 text-xs font-bold transition', f.ctcUnit === k ? 'bg-white text-indigo-700 shadow' : 'text-slate-500')}>{u.label}</button>
            ))}
          </div>
          <TextInput type="number" inputMode="decimal" min="0" value={f.ctcAmount} onChange={(e) => set('ctcAmount', e.target.value)} error={errors.ctcAmount} placeholder={CTC_UNITS[f.ctcUnit].hint} className="!h-14 !text-xl font-extrabold" />
        </Field>
      </div>

      <Field label="Resume or portfolio link" required error={errors.resume} className="mt-7" hint="Google Drive, LinkedIn, GitHub or a personal site. Shared only after purchase.">
        <TextInput type="url" placeholder="https://" value={f.resume} onChange={(e) => set('resume', e.target.value)} error={errors.resume} />
      </Field>
    </>
  );
}

function ReviewRow({ icon: Icon, label, children, onEdit }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon size={15} /></span>
      <div className="min-w-0 flex-1"><div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="text-sm font-semibold text-slate-800">{children}</div></div>
      <button type="button" onClick={onEdit} className="rounded-full p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" aria-label={`Edit ${label}`}><Pencil size={14} /></button>
    </div>
  );
}

function StepReview({ f, errors, consent, setConsent, goto, categories }) {
  return (
    <>
      <StepHeader n={4} title="Review & submit" text="One last look. You can edit anything before you submit." />
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
        <ReviewRow icon={UserCheck} label="Contact" onEdit={() => goto(1)}>{f.name} · {f.email} · {f.phone}</ReviewRow>
        <ReviewRow icon={MapPin} label="Location" onEdit={() => goto(1)}>{f.currentLocation} → {f.preferredLocation}</ReviewRow>
        <ReviewRow icon={Briefcase} label="Role" onEdit={() => goto(2)}>{f.role} · {f.industry} · {f.experience} ({f.years} yrs)</ReviewRow>
        <ReviewRow icon={GraduationCap} label="Education" onEdit={() => goto(2)}>{f.education}</ReviewRow>
        <ReviewRow icon={Sparkles} label="Skills" onEdit={() => goto(2)}>{f.skills.join(', ')}</ReviewRow>
        <ReviewRow icon={Clock} label="Availability" onEdit={() => goto(3)}>{f.noticePeriod} notice</ReviewRow>
        <ReviewRow icon={Wallet} label="Expected pay" onEdit={() => goto(3)}>{CTC_UNITS[f.ctcUnit].fmt(f.ctcAmount)}</ReviewRow>
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={20} />
          <div className="text-sm leading-relaxed text-emerald-900"><b>What recruiters see:</b> your role, experience, skills, notice period, expected pay and general location. <b>What stays hidden until purchase:</b> your name, email, phone and resume link.</div>
        </div>
      </div>

      <label className={cx('mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-sm transition', errors.consent ? 'border-rose-300 bg-rose-50' : consent ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200')}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-indigo-600" />
        <span className="text-slate-600">I consent to my profile being listed on the marketplace and my contact details being shared with <b>verified recruiters</b> who purchase it. I can request removal at any time.{errors.consent && <b className="mt-1 block text-rose-600">{errors.consent}</b>}</span>
      </label>
    </>
  );
}

/* --------------------------------- success -------------------------------- */

const CONFETTI_COLORS = ['#6366f1', '#d946ef', '#f59e0b', '#10b981', '#0ea5e9', '#f43f5e'];

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 44 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.9, size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], round: i % 3 === 0,
  })), []);
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 4500); return () => clearTimeout(t); }, []);
  if (!on) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} className="absolute top-0 animate-confetti" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, width: p.size, height: p.round ? p.size : p.size * 0.5, background: p.color, borderRadius: p.round ? '50%' : 2 }} />
      ))}
    </div>
  );
}

function Success({ done, onReset }) {
  const { toast } = useApp();
  const copy = async () => {
    try { await navigator.clipboard.writeText(done.id); toast('Candidate ID copied'); } catch { toast('Copy not available in this browser', 'error'); }
  };
  const timeline = [
    ['Profile submitted', 'Just now', 'done'],
    ['Verification review', 'Within 1 business day', 'now'],
    ['Live in the marketplace', 'Recruiters can discover you', 'todo'],
    ['Recruiters reach out', 'After they unlock your contact', 'todo'],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
      <Confetti />
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-card">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 px-6 py-12 text-center text-white">
          <div className="absolute inset-0 bg-dots" />
          <div className="relative">
            <div className="relative mx-auto mb-5 h-20 w-20">
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-white/40" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-500 shadow-xl"><CircleCheck size={44} /></div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">You're in, {done.name.split(' ')[0]}!</h1>
            <p className="mx-auto mt-2 max-w-md text-emerald-50">Your profile is in our verification queue. We'll make it discoverable as soon as it's approved.</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="relative mx-auto max-w-md rounded-3xl border-2 border-dashed border-indigo-300 bg-brand-soft p-6 text-center">
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white ring-1 ring-slate-200" />
            <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white ring-1 ring-slate-200" />
            <div className="text-[11px] font-extrabold uppercase tracking-[.25em] text-indigo-500">Candidate ID</div>
            <div className="my-2 font-mono text-4xl font-extrabold tracking-wider text-gradient">{done.id}</div>
            <div className="flex flex-wrap justify-center gap-2"><Badge tone="amber" icon={Clock}>Pending verification</Badge><Badge tone="indigo">{done.role}</Badge></div>
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500"><span>Registered {fmtDate(done.createdAt)}</span><button onClick={copy} className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline"><Copy size={12} /> Copy ID</button></div>
          </div>

          <ol className="mx-auto mt-10 max-w-md space-y-0">
            {timeline.map(([t, s, st], i) => (
              <li key={t} className="relative flex gap-4 pb-6 last:pb-0">
                {i < timeline.length - 1 && <span className={cx('absolute left-[15px] top-8 h-full w-0.5', st === 'done' ? 'bg-emerald-300' : 'bg-slate-200')} />}
                <span className={cx('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold', st === 'done' && 'bg-emerald-500 text-white', st === 'now' && 'bg-amber-100 text-amber-600 ring-4 ring-amber-50', st === 'todo' && 'bg-slate-100 text-slate-400')}>
                  {st === 'done' ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <div><div className={cx('text-sm font-extrabold', st === 'todo' ? 'text-slate-400' : 'text-slate-900')}>{t}</div><div className="text-xs text-slate-500">{s}</div></div>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-extrabold text-slate-900">Know someone who's hiring?</h3>
              <p className="mt-1 text-sm text-slate-500">Recruiters can buy verified, consent-based talent data — individually or in bundles.</p>
              <Btn as={Link} to="/marketplace" variant="dark" size="md" icon={Store} className="mt-4">Browse talent data</Btn>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <h3 className="font-extrabold text-slate-900">Got a colleague job-hunting?</h3>
              <p className="mt-1 text-sm text-slate-500">Registering another profile takes about two minutes.</p>
              <Btn variant="soft" size="md" icon={UserCheck} className="mt-4" onClick={onReset}>Register another profile</Btn>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">Demo tip: open <Link to="/admin/candidates" className="font-bold text-indigo-600 hover:underline">the admin console</Link> to verify this profile and put it live.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function Join() {
  const { addCandidate, categories, toast } = useApp();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    const preset = categories.find((c) => c.id === params.get('industry'));
    return { ...EMPTY_FORM, industry: preset?.name || '' };
  });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(null);

  const strength = profileStrength(form);
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const next = () => {
    const errs = validateCandidate(form, [step]);
    setErrors(errs);
    if (Object.keys(errs).length) return toast('Please complete the highlighted fields', 'error');
    setStep((s) => s + 1);
    top();
  };
  const goto = (n) => { setStep(n); top(); };
  const submit = () => {
    const errs = validateCandidate(form, [1, 2, 3]);
    if (!consent) errs.consent = 'Consent is required to submit';
    setErrors(errs);
    if (Object.keys(errs).length) return toast('Please complete the highlighted fields', 'error');
    setDone(addCandidate(toCandidateData(form)));
    window.scrollTo({ top: 0 });
  };
  const reset = () => { setForm(EMPTY_FORM); setStep(1); setConsent(false); setErrors({}); setDone(null); top(); };

  if (done) return <Success done={done} onReset={reset} />;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-brand-soft" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[400px_1fr] lg:py-12">
        {/* Left rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-2xl shadow-indigo-900/20 md:p-7">
            <div className="absolute inset-0 bg-dots opacity-70" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-600/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-600/40 blur-3xl" />
            <div className="relative">
              <Badge tone="dark" icon={Sparkles} className="bg-white/10 text-indigo-200 ring-1 ring-white/20">Free · 2 minutes</Badge>
              <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">Build the profile recruiters <span className="bg-gradient-to-r from-amber-200 to-pink-300 bg-clip-text text-transparent">can't scroll past</span></h1>

              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                <StrengthRing value={strength} />
                <div><div className="text-sm font-extrabold">Profile strength</div><div className="text-xs text-indigo-100">{strength < 40 ? 'Just getting started' : strength < 80 ? 'Looking good — keep going' : strength < 100 ? 'Almost perfect' : 'Recruiter-ready!'}</div></div>
              </div>

              <ol className="mt-6 hidden space-y-1 lg:block">
                {STEPS.map((s, i) => {
                  const n = i + 1;
                  const st = n < step ? 'done' : n === step ? 'now' : 'todo';
                  return (
                    <li key={s.label}>
                      <button type="button" disabled={n > step} onClick={() => goto(n)} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition', st === 'now' && 'bg-white/10', n <= step && 'hover:bg-white/10')}>
                        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold', st === 'done' && 'bg-emerald-400 text-slate-900', st === 'now' && 'bg-white text-indigo-700', st === 'todo' && 'bg-white/10 text-white/50')}>{st === 'done' ? <Check size={15} strokeWidth={3} /> : <s.icon size={15} />}</span>
                        <span><span className={cx('block text-sm font-bold', st === 'todo' && 'text-white/50')}>{s.label}</span><span className="block text-[11px] text-indigo-200/80">{s.hint}</span></span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <ul className="mt-6 space-y-2.5 text-sm text-indigo-100">
                {[[Lock, 'Contact details masked until purchase'], [BadgeCheck, 'Only verified recruiters can unlock'], [Eye, 'Get discovered by skill & role']].map(([Icon, t]) => (
                  <li key={t} className="flex items-center gap-2.5"><Icon size={15} className="text-emerald-300" />{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 hidden lg:block"><ProfilePreview form={form} categories={categories} /></div>
        </aside>

        {/* Form */}
        <section className="min-w-0">
          <ol className="mb-5 flex items-center gap-1.5 lg:hidden" aria-label="Progress">
            {STEPS.map((s, i) => <li key={s.label} className={cx('h-1.5 flex-1 rounded-full transition-all', i + 1 <= step ? 'bg-brand' : 'bg-slate-200')} />)}
          </ol>
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-card md:p-9">
            <div key={step} className="animate-fade-up">
              {step === 1 && <StepAbout f={form} set={set} errors={errors} />}
              {step === 2 && <StepCareer f={form} set={set} errors={errors} categories={categories} />}
              {step === 3 && <StepSearch f={form} set={set} errors={errors} />}
              {step === 4 && (
                <>
                  <StepReview f={form} errors={errors} consent={consent} setConsent={(v) => { setConsent(v); setErrors((e) => ({ ...e, consent: undefined })); }} goto={goto} categories={categories} />
                  <div className="mt-6 lg:hidden"><ProfilePreview form={form} categories={categories} /></div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/90 px-5 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:backdrop-blur-none">
              <Btn variant="outline" size="lg" icon={ArrowLeft} className={step === 1 ? 'invisible' : ''} onClick={() => goto(step - 1)}>Back</Btn>
              {step < 4
                ? <Btn size="lg" iconRight={ArrowRight} onClick={next}>Continue</Btn>
                : <Btn variant="success" size="lg" icon={Check} onClick={submit}>Submit my profile</Btn>}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">Your information is stored in this demo only. No emails or SMS are sent.</p>
        </section>
      </div>
    </div>
  );
}
