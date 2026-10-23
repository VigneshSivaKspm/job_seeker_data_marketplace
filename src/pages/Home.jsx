import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Bell, Check, ChevronDown, Clock, Eye, EyeOff, FileCheck2, Lock, Mail, MapPin, Phone,
  ShieldCheck, Sparkles, Star, Store, Trash2, Unlock, UserPlus, Users, Wallet, Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { THEMES } from '../lib/data.js';
import { cx, fmtINR, fmtINR2 } from '../lib/utils.js';
import { Badge, Btn, IndustryTile, Reveal } from '../components/ui.jsx';
import { CandidateCard } from '../components/market.jsx';

/* ------------------------------ small pieces ----------------------------- */

function CountUp({ to, suffix = '', duration = 1400 }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const run = () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / duration, 1);
        setVal(Math.round(to * (1 - (1 - p) ** 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { setVal(to); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString('en-US')}{suffix}</span>;
}

function SectionHead({ eyebrow, title, text, center = true, light }) {
  return (
    <div className={cx('max-w-2xl', center && 'mx-auto text-center')}>
      <span className={cx('inline-block rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest', light ? 'bg-white/10 text-indigo-200 ring-1 ring-white/20' : 'bg-indigo-50 text-indigo-600')}>{eyebrow}</span>
      <h2 className={cx('mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl', light ? 'text-white' : 'text-slate-900')}>{title}</h2>
      {text && <p className={cx('mt-3 text-base leading-relaxed', light ? 'text-slate-300' : 'text-slate-500')}>{text}</p>}
    </div>
  );
}

/* ---------------------------------- hero --------------------------------- */

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-indigo-300/50 via-fuchsia-200/50 to-amber-200/50 blur-3xl" />

      <div className="relative animate-float rounded-[28px] border border-white bg-white p-6 shadow-2xl shadow-indigo-900/15 ring-1 ring-slate-200/70">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">How recruiters see you</span>
          <Badge tone="slate" icon={Lock}>Masked</Badge>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl font-extrabold text-white shadow-lg">PN</div>
          <div>
            <div className="font-mono text-lg font-bold tracking-wide text-slate-900">P**** N***</div>
            <div className="mt-0.5 text-sm font-bold text-indigo-600">Senior Frontend Engineer</div>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-500"><Mail size={13} className="text-slate-400" /> p*********@gmail.com <Lock size={12} className="ml-auto text-slate-300" /></div>
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-500"><Phone size={13} className="text-slate-400" /> +91 94******13 <Lock size={12} className="ml-auto text-slate-300" /></div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[['Experience', '7 yrs'], ['Notice', '30 days'], ['Expected', '₹28 LPA']].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-brand-soft px-2 py-2.5"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</div><div className="text-sm font-extrabold text-slate-800">{v}</div></div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {['React', 'TypeScript', 'GraphQL', 'Accessibility'].map((s, i) => (
            <span key={s} className={cx('rounded-lg px-2.5 py-1 text-[11px] font-bold', ['bg-indigo-50 text-indigo-700', 'bg-sky-50 text-sky-700', 'bg-fuchsia-50 text-fuchsia-700', 'bg-emerald-50 text-emerald-700'][i])}>{s}</span>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><MapPin size={13} /> Kochi → Bengaluru / Remote</div>
      </div>

      <div className="absolute -right-3 -top-10 animate-float-rev rounded-2xl bg-white px-4 py-3 shadow-xl shadow-indigo-900/10 ring-1 ring-slate-200/70 md:-right-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Eye size={18} /></span>
          <div><div className="text-sm font-extrabold text-slate-900">3 recruiters</div><div className="text-[11px] text-slate-500">viewed your profile today</div></div>
        </div>
      </div>
      <div className="absolute -bottom-12 -left-3 animate-float rounded-2xl bg-white px-4 py-3 shadow-xl shadow-emerald-900/10 ring-1 ring-slate-200/70 md:-left-10" style={{ animationDelay: '1.2s' }}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Unlock size={18} /></span>
          <div><div className="text-sm font-extrabold text-slate-900">Verified recruiter</div><div className="text-[11px] text-slate-500">unlocked your contact</div></div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid mask-fade-b" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pb-20 pt-10 md:px-6 lg:grid-cols-[1.05fr_.95fr] lg:pb-28 lg:pt-16">
        <div>
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-soft ring-1 ring-slate-200/70">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"><Sparkles size={11} /></span>
            Free for job seekers · Takes 2 minutes
          </div>
          <h1 className="animate-fade-up mt-6 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl lg:text-[4.1rem]" style={{ animationDelay: '80ms' }}>
            Get found by recruiters.<br /><span className="text-gradient">Keep your contact private.</span>
          </h1>
          <p className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-slate-600" style={{ animationDelay: '160ms' }}>
            Create one profile and let verified recruiters discover your skills, experience and expected pay. Your name, email and phone stay masked until someone with a genuine hiring need unlocks them.
          </p>
          <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '240ms' }}>
            <Btn as={Link} to="/join" size="xl" icon={UserPlus} iconRight={ArrowRight}>Create my free profile</Btn>
            <Btn as={Link} to="/marketplace" size="xl" variant="outline" icon={Store}>I'm hiring — browse data</Btn>
          </div>
          <ul className="animate-fade-up mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-semibold text-slate-600" style={{ animationDelay: '320ms' }}>
            {['No spam, ever', 'Contact details masked', 'Verified recruiters only'].map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={12} strokeWidth={3} /></span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="animate-fade-up px-3 md:px-10 lg:px-0" style={{ animationDelay: '200ms' }}><HeroVisual /></div>
      </div>
    </section>
  );
}

/* ------------------------------ role marquee ----------------------------- */

function Marquee() {
  const { categories } = useApp();
  const items = categories.flatMap((c) => c.roles.map((r) => ({ r, c })));
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-slate-200/70 bg-white py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
      <div className="flex w-max animate-marquee gap-3">
        {row.map(({ r, c }, i) => (
          <span key={`${r}-${i}`} className={cx('inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold', (THEMES[c.color] || THEMES.indigo).soft)}>
            <span className={cx('h-1.5 w-1.5 rounded-full', (THEMES[c.color] || THEMES.indigo).bar)} />{r}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- stats --------------------------------- */

function Stats() {
  const { candidates, categories, orders } = useApp();
  const stats = [
    { icon: Users, value: candidates.length, label: 'Job seekers registered', tone: 'from-indigo-500 to-violet-500' },
    { icon: Store, value: categories.length, label: 'Industries covered', tone: 'from-fuchsia-500 to-pink-500' },
    { icon: BadgeCheck, value: new Set(orders.map((o) => o.company)).size, label: 'Verified recruiter firms', tone: 'from-emerald-500 to-teal-500' },
    { icon: Lock, value: 100, suffix: '%', label: 'Contact details masked', tone: 'from-amber-500 to-orange-500' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 80} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft md:p-6">
            <div className={cx('mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', s.tone)}><s.icon size={20} /></div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl"><CountUp to={s.value} suffix={s.suffix} /></div>
            <div className="mt-1 text-sm font-semibold text-slate-500">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ how it works ----------------------------- */

function HowItWorks() {
  const steps = [
    { icon: UserPlus, title: 'Build your profile', text: 'Tell us your role, skills, notice period and expected pay in a guided 2-minute form.', grad: 'from-indigo-500 to-violet-500' },
    { icon: FileCheck2, title: 'Get verified', text: 'Our team reviews every profile so recruiters can trust what they see.', grad: 'from-fuchsia-500 to-pink-500' },
    { icon: Eye, title: 'Be discovered', text: 'Recruiters search by skill, role, location and notice period — seeing only your masked profile.', grad: 'from-amber-500 to-orange-500' },
    { icon: Unlock, title: 'They reach out', text: 'Only after a verified recruiter unlocks your details will they contact you directly.', grad: 'from-emerald-500 to-teal-500' },
  ];
  return (
    <section id="how" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHead eyebrow="How it works" title="From profile to opportunity in four steps" text="No endless forms, no inbox flooded with spam — just relevant, verified recruiters." />
        <div className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-[34px] hidden h-0.5 bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-emerald-200 lg:block" />
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 100} className="relative text-center lg:text-left">
              <div className={cx('relative mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-lg lg:mx-0', s.grad)}>
                <s.icon size={28} />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-extrabold text-slate-900 shadow ring-1 ring-slate-200">{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- privacy ------------------------------- */

function Privacy() {
  const rows = [
    [Lock, 'Masked by default', 'Name, email and phone are hidden in every search result and preview.'],
    [BadgeCheck, 'Verified buyers only', 'Only recruiters who pass verification and purchase can unlock your contact details.'],
    [Trash2, 'Delete anytime', 'Ask us to remove your profile and it disappears from the marketplace.'],
    [Bell, 'No cold spam', 'Your contact is never published or sold in bulk without the same masking rules.'],
  ];
  return (
    <section id="privacy" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 md:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHead center={false} eyebrow="Privacy promise" title="You control who gets to call you" text="Your profile is the shop window. Your contact details are the key — and you decide who gets it." />
          <ul className="mt-8 space-y-5">
            {rows.map(([Icon, t, d], i) => (
              <Reveal as="li" key={t} delay={i * 80} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon size={20} /></span>
                <div><h3 className="font-extrabold text-slate-900">{t}</h3><p className="text-sm leading-relaxed text-slate-500">{d}</p></div>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal className="relative">
          <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-tr from-emerald-200/40 via-sky-200/40 to-indigo-200/40 blur-2xl" />
          <div className="relative grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
              <Badge tone="slate" icon={EyeOff}>Before purchase</Badge>
              <div className="mt-4 font-mono text-base font-bold text-slate-900">V***** K****</div>
              <div className="mt-2 space-y-1.5 font-mono text-xs text-slate-400"><div>v***********@gmail.com</div><div>+91 98******76</div></div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-xl shadow-emerald-500/25">
              <Badge tone="dark" icon={Unlock} className="bg-white/20">After verified purchase</Badge>
              <div className="mt-4 text-base font-extrabold">Vikram Kumar</div>
              <div className="mt-2 space-y-1.5 text-xs text-emerald-50"><div>vikram.kumar@gmail.com</div><div>+91 98450 31276</div></div>
            </div>
            <div className="rounded-3xl bg-slate-900 p-5 text-slate-300 sm:col-span-2">
              <div className="flex items-center gap-3"><ShieldCheck className="text-emerald-400" size={22} /><p className="text-sm leading-relaxed">Role, experience, skills, notice period, expected pay and location are always visible so recruiters can judge fit — nothing personally identifying is.</p></div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- industries ------------------------------ */

function Industries() {
  const { categories, candidates } = useApp();
  return (
    <section className="bg-brand-soft py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHead eyebrow="Every industry" title="Whatever you do, there's a recruiter looking" text="Pick your industry and we'll tailor the form to your role." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => {
            const t = THEMES[c.color] || THEMES.indigo;
            const count = candidates.filter((x) => x.industry === c.name && x.status !== 'Pending Verification').length;
            return (
              <Reveal key={c.id} delay={i * 60}>
                <Link to={`/join?industry=${c.id}`} className="group flex h-full items-center gap-4 rounded-3xl border border-white bg-white/80 p-5 shadow-soft backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-card">
                  <IndustryTile cat={c} size="h-14 w-14" iconSize={24} className="transition group-hover:scale-110" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900">{c.name}</h3>
                    <p className="truncate text-xs text-slate-500">{c.roles.slice(0, 3).join(' · ')}</p>
                    <span className={cx('mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold', t.soft)}>{count} live profiles</span>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- recruiters band --------------------------- */

function RecruiterBand() {
  const { candidates, packages } = useApp();
  const sortedPkgs = [...packages].sort((a, b) => a.contacts - b.contacts).slice(0, 4);
  const minRate = packages.length ? Math.min(...packages.map((p) => p.price / p.contacts)) : 0;
  const picks = candidates.filter((c) => c.status === 'Active').sort((a, b) => b.years - a.years).slice(0, 3);
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20">
      <div className="absolute inset-0 bg-dots opacity-50" />
      <div className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHead light center={false} eyebrow="For recruiters" title="Skip the sourcing. Buy ready-to-contact talent data." text="Filter by skill, role, location and notice period. Pay only to unlock the contact details — individually, or in discounted industry bundles." />
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Btn as={Link} to="/marketplace" variant="white" size="lg" iconRight={ArrowRight}>Browse all profiles</Btn>
            <Btn as={Link} to="/marketplace/bundles" variant="glass" size="lg">See bundles</Btn>
          </div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {picks.map((c, i) => <Reveal key={c.id} delay={i * 100}><CandidateCard c={c} /></Reveal>)}
        </div>
        {sortedPkgs.length > 0 && (
          <div className="mt-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><h3 className="text-2xl font-extrabold tracking-tight text-white">Bulk contact packages</h3><p className="text-slate-400">Buy credits once, unlock any profile for 1 credit.</p></div>
              <Link to="/marketplace/packages" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-300 hover:text-white">See all packages <ArrowRight size={15} /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sortedPkgs.map((p, i) => (
                <Link key={p.id} to="/marketplace/packages" className={cx('group relative rounded-3xl p-5 ring-1 transition duration-300 hover:-translate-y-1', p.popular ? 'bg-brand text-white ring-white/30 shadow-lift' : 'bg-white/5 text-white ring-white/10 hover:bg-white/10')}>
                  {p.popular && <span className="absolute -top-3 right-4 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Popular</span>}
                  <div className="text-xs font-bold uppercase tracking-widest text-white/60">{p.name}</div>
                  <div className="mt-1 text-3xl font-extrabold tracking-tight">{p.contacts.toLocaleString('en-IN')} <span className="text-base font-bold text-white/70">contacts</span></div>
                  <div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-extrabold">{fmtINR(p.price)}</span><span className="text-sm text-white/60">{fmtINR2(p.price / p.contacts)}/contact</span></div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[[Zap, 'Instant unlock', 'Details appear the moment payment clears.'], [Wallet, `From ${fmtINR(minRate)} per contact`, 'Bulk packs: 100 contacts for ₹1,000, 1,000 for ₹7,000.'], [Check, 'CSV & Excel export', 'Drop leads straight into your ATS or CRM.']].map(([Icon, t, d]) => (
            <div key={t} className="flex items-start gap-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-300"><Icon size={19} /></span>
              <div><h3 className="font-bold text-white">{t}</h3><p className="text-sm text-slate-400">{d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- faq --------------------------------- */

const FAQS = [
  ['Is it really free for job seekers?', 'Yes. Creating and maintaining your profile is completely free. Recruiters pay to unlock your contact details — never you.'],
  ['Who can see my phone number and email?', 'Nobody by default. They are masked everywhere. Only a verified recruiter who purchases your profile can see them.'],
  ['How long does verification take?', 'New profiles enter a verification queue and typically go live within one business day once reviewed.'],
  ['Can I remove my profile?', 'Yes — request removal at any time and your profile is deleted from the marketplace.'],
  ['What do recruiters see before they pay?', 'Only your role, experience level, skills, notice period, expected pay and general location. Nothing that identifies you personally.'],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl px-4 py-20 md:px-6">
      <SectionHead eyebrow="FAQ" title="Questions, answered" />
      <div className="mt-10 space-y-3">
        {FAQS.map(([q, a], i) => (
          <div key={q} className={cx('overflow-hidden rounded-2xl border bg-white transition', open === i ? 'border-indigo-200 shadow-soft' : 'border-slate-200/80')}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={open === i}>
              <span className="font-bold text-slate-900">{q}</span>
              <ChevronDown size={18} className={cx('shrink-0 text-slate-400 transition-transform', open === i && 'rotate-180 text-indigo-500')} />
            </button>
            {open === i && <p className="animate-fade-in px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-20 md:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-brand px-6 py-14 text-center text-white shadow-lift md:py-20">
        <div className="absolute inset-0 bg-dots" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="relative">
          <div className="mx-auto mb-5 flex w-fit items-center gap-1 text-amber-300">{[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}</div>
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">Your next opportunity is looking for you</h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-100">Join in two minutes. Stay private. Let the right recruiters come to you.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Btn as={Link} to="/join" variant="white" size="xl" icon={UserPlus}>Create my free profile</Btn>
            <Btn as={Link} to="/marketplace" variant="glass" size="xl">I'm a recruiter</Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Stats />
      <HowItWorks />
      <Privacy />
      <Industries />
      <RecruiterBand />
      <Faq />
      <FinalCta />
    </>
  );
}
