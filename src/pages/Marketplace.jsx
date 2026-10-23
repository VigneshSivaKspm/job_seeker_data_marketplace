import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Download, ExternalLink, FileSpreadsheet, LayoutGrid, Lock, Mail, MapPin,
  Briefcase, Clock, Coins, Crown, Layers, Package, Phone, Plus, Zap, Receipt, Search, ShieldCheck, SlidersHorizontal, Sparkles, Table2, Unlock, Users, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { BUNDLES, EXP_LEVELS, PRICE_TIERS, THEMES, THEME_KEYS } from '../lib/data.js';
import { cx, fmtDateTime, fmtINR, fmtINR2, maskName, orderSummary, round2 } from '../lib/utils.js';
import { Avatar, Badge, Btn, ConfirmDialog, EmptyState, Reveal, Sheet } from '../components/ui.jsx';
import { CandidateCard, CandidateTable, DEFAULT_FILTERS, FilterPanel } from '../components/market.jsx';
import { iconFor } from '../components/ui.jsx';

/* ------------------------------ page shell ------------------------------ */

export default function Marketplace() {
  const { candidates, categories, purchasedIds, orders, packages, wallet } = useApp();
  const active = candidates.filter((c) => c.status === 'Active').length;
  const minRate = packages.length ? Math.min(...packages.map((p) => p.price / p.contacts)) : 0;
  const tabs = [
    { to: '/marketplace', label: 'Catalog', end: true, icon: LayoutGrid },
    { to: '/marketplace/packages', label: 'Bulk packages', icon: Layers },
    { to: '/marketplace/bundles', label: 'Bundles', icon: Package },
    { to: '/marketplace/purchases', label: 'Purchased', icon: Unlock, count: purchasedIds.length },
  ];
  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <Badge tone="dark" icon={BadgeCheck} className="bg-white/10 text-indigo-200 ring-1 ring-white/20">For verified recruiters</Badge>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Hire faster with <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">consent-based talent data</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">Evaluate role, experience, skills, notice period and expected pay for free. Pay only to unlock contact details — instantly.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[[Users, `${active} verified profiles`], [Package, `${categories.length} industries`], [Receipt, `${orders.length} orders fulfilled`], [Coins, `From ${fmtINR(minRate)} per contact`]].map(([Icon, t]) => (
              <div key={t} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur"><Icon size={15} className="text-indigo-300" />{t}</div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) => cx('inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition', isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:ring-slate-300')}>
              <t.icon size={16} />{t.label}{t.count > 0 && <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] font-extrabold text-white">{t.count}</span>}
            </NavLink>
          ))}
          <Link to="/marketplace/packages" className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-amber-500/25"><Coins size={16} />{wallet.credits.toLocaleString('en-IN')} credits</Link>
        </div>
        <Outlet />

        <Reveal className="mt-14 overflow-hidden rounded-3xl bg-brand p-6 text-white md:p-10">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Looking for your next role instead?</h2>
              <p className="mt-1 text-indigo-100">Create a free profile and let verified recruiters come to you. Your contact details stay private.</p>
            </div>
            <Btn as={Link} to="/join" variant="white" size="lg" iconRight={ArrowRight}>Create my profile</Btn>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* -------------------------------- catalog -------------------------------- */

const PAGE_SIZE = 12;

export function Catalog() {
  const { candidates, categories, isUnlocked, priceOf, wallet, packages, unlockWithCredits } = useApp();
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [desktopFilters, setDesktopFilters] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [layout, setLayout] = useState('grid');
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => setShown(PAGE_SIZE), [filters]);

  const visible = useMemo(() => {
    const tokens = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = candidates.filter((c) => {
      if (c.status === 'Pending Verification') return false;
      if (filters.industry !== 'All' && c.industry !== filters.industry) return false;
      if (filters.role !== 'All' && c.role !== filters.role) return false;
      if (filters.minExp !== 'All' && EXP_LEVELS.indexOf(c.experience) < EXP_LEVELS.indexOf(filters.minExp)) return false;
      if (filters.notice !== 'All' && c.noticePeriod !== filters.notice) return false;
      if (filters.tier !== 'All' && !PRICE_TIERS.find((t) => t.id === filters.tier).test(priceOf(c))) return false;
      if (tokens.length) {
        // contact details are only searchable once purchased, so search can't leak masked PII
        const hay = [c.id, c.role, c.industry, c.currentLocation, c.preferredLocation, c.education, c.experience, c.skills.join(' '), isUnlocked(c.id) ? `${c.name} ${c.email}` : '']
          .join(' ').toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      priceAsc: (a, b) => priceOf(a) - priceOf(b),
      priceDesc: (a, b) => priceOf(b) - priceOf(a),
      exp: (a, b) => b.years - a.years,
    };
    return [...list].sort(sorters[filters.sort]);
  }, [candidates, filters, isUnlocked, priceOf]);

  const activeCount = ['industry', 'role', 'minExp', 'notice', 'tier'].filter((k) => filters[k] !== 'All').length;
  const unlockable = visible.filter((c) => c.status === 'Active' && !isUnlocked(c.id));
  const bulkCount = Math.min(unlockable.length, wallet.credits);
  const minRate = packages.length ? Math.min(...packages.map((p) => p.price / p.contacts)) : 0;
  const reset = () => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }));

  return (
    <div className="flex gap-6">
      <aside className={cx('hidden w-72 shrink-0 self-start rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft lg:sticky lg:top-24', desktopFilters && 'md:block')}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><SlidersHorizontal size={16} className="text-indigo-500" /> Filters</h3>
          {activeCount > 0 && <button onClick={reset} className="text-xs font-bold text-indigo-600 hover:underline">Reset ({activeCount})</button>}
        </div>
        <FilterPanel filters={filters} setFilters={setFilters} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-[68px] z-20 -mx-4 bg-slate-50/90 px-4 pb-3 pt-3 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder="Search skills, job title or location…"
                className="h-[52px] w-full rounded-full border border-slate-200 bg-white pl-12 pr-11 text-base font-medium shadow-soft placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 md:text-[15px]"
              />
              {filters.q && <button onClick={() => setFilters((f) => ({ ...f, q: '' }))} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>}
            </div>
            <Btn variant="outline" size="lg" icon={SlidersHorizontal} className="relative !h-[52px] md:hidden" onClick={() => setSheetOpen(true)} aria-label="Filters">
              {activeCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-extrabold text-white">{activeCount}</span>}
            </Btn>
            <Btn variant="outline" size="lg" icon={SlidersHorizontal} className="hidden !h-[52px] md:inline-flex" onClick={() => setDesktopFilters((v) => !v)}>
              {desktopFilters ? 'Hide filters' : 'Filters'}{!desktopFilters && activeCount > 0 && ` (${activeCount})`}
            </Btn>
          </div>

          <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {[{ id: 'all', name: 'All' }, ...categories].map((c) => {
              const on = filters.industry === c.name;
              const Icon = c.id === 'all' ? Sparkles : iconFor(c.id);
              return (
                <button key={c.id} onClick={() => setFilters((f) => ({ ...f, industry: c.name, role: 'All' }))}
                  className={cx('inline-flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition', on ? 'bg-brand text-white shadow-md shadow-indigo-500/25' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:ring-indigo-300')}>
                  <Icon size={15} />{c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500"><span className="font-extrabold text-slate-900">{visible.length}</span> verified profile{visible.length !== 1 && 's'}</p>
          <div className="flex items-center gap-2">
            <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} aria-label="Sort" className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/15">
              <option value="newest">Newest first</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="exp">Most experienced</option>
            </select>
            <div className="hidden rounded-full bg-white p-1 ring-1 ring-inset ring-slate-200 lg:flex">
              {[['grid', LayoutGrid], ['table', Table2]].map(([id, Icon]) => (
                <button key={id} onClick={() => setLayout(id)} aria-label={`${id} view`} className={cx('rounded-full p-2 transition', layout === id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800')}><Icon size={16} /></button>
              ))}
            </div>
          </div>
        </div>
        {wallet.credits > 0 && unlockable.length > 0 ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-lg shadow-emerald-500/20 md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20"><Coins size={22} /></span>
              <div><div className="font-extrabold">{wallet.credits.toLocaleString('en-IN')} credits available</div><div className="text-sm text-emerald-50">{unlockable.length} matching profile{unlockable.length > 1 ? 's' : ''} still locked</div></div>
            </div>
            <Btn variant="white" icon={Zap} onClick={() => setConfirmBulk(true)}>Unlock {bulkCount === unlockable.length ? `all ${bulkCount}` : `first ${bulkCount}`} matches</Btn>
          </div>
        ) : wallet.credits === 0 ? (
          <Link to="/marketplace/packages" className="group mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-4 text-white shadow-lg shadow-indigo-500/20 md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20"><Layers size={22} /></span>
              <div><div className="font-extrabold">Hiring at scale? Buy contacts in bulk</div><div className="text-sm text-indigo-100">Packs from {fmtINR(minRate)} per contact — 100 contacts for {fmtINR(1000)}, 1,000 for {fmtINR(7000)}</div></div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-indigo-700 transition group-hover:-translate-y-px">View packages <ArrowRight size={15} /></span>
          </Link>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState icon={Search} title="No profiles match your filters" text="Try removing a filter or searching a broader skill keyword." action={<Btn variant="soft" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear all filters</Btn>} />
        ) : layout === 'table' ? (
          <CandidateTable rows={visible.slice(0, shown)} />
        ) : (
          <div className={cx('grid grid-cols-1 gap-5 sm:grid-cols-2', desktopFilters ? 'md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3')}>
            {visible.slice(0, shown).map((c) => <CandidateCard key={c.id} c={c} />)}
          </div>
        )}
        {visible.length > shown && <div className="mt-8 text-center"><Btn variant="outline" size="lg" onClick={() => setShown((s) => s + PAGE_SIZE)}>Show more profiles</Btn></div>}
      </div>

      <ConfirmDialog open={confirmBulk} tone="primary" confirmLabel="Unlock now" title="Unlock matching profiles?"
        message={`This uses ${bulkCount} of your ${wallet.credits.toLocaleString('en-IN')} credits to reveal full contact details for ${bulkCount} profile${bulkCount > 1 ? 's' : ''}. You can export them afterwards from My purchases.`}
        onCancel={() => setConfirmBulk(false)} onConfirm={() => { unlockWithCredits(unlockable.slice(0, bulkCount).map((c) => c.id)); setConfirmBulk(false); }} />

      <Sheet
        open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters" subtitle={`${visible.length} matching profiles`}
        footer={<div className="flex gap-2"><Btn variant="outline" size="lg" className="flex-1" onClick={reset}>Reset</Btn><Btn size="lg" className="flex-1" onClick={() => setSheetOpen(false)}>Show {visible.length} results</Btn></div>}
      >
        <FilterPanel filters={filters} setFilters={setFilters} />
      </Sheet>
    </div>
  );
}

/* --------------------------------- bundles -------------------------------- */

const EXP_BAR = { Entry: 'bg-sky-500', Mid: 'bg-emerald-500', Senior: 'bg-indigo-500', Lead: 'bg-fuchsia-500' };
const countBy = (arr, fn) => arr.reduce((m, x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; return m; }, {});

function BundleStat({ icon: Icon, value, label, tone }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5 text-center ring-1 ring-slate-200/70">
      <span className={cx('mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl', tone)}><Icon size={16} /></span>
      <div className="text-2xl font-extrabold leading-none tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

function BundleCard({ bundle, index }) {
  const { resolveBundle, priceOf, addBundle, cartItems, setCartOpen, categories } = useApp();
  const [showAll, setShowAll] = useState(false);
  const theme = THEMES[THEME_KEYS[index % THEME_KEYS.length]];
  const profiles = resolveBundle(bundle);
  const n = profiles.length;
  const gross = profiles.reduce((s, c) => s + priceOf(c), 0);
  const price = round2((gross * (100 - bundle.discount)) / 100);
  const saved = round2(gross - price);
  const added = cartItems.some((i) => i.key === `bundle:${bundle.id}`);

  const roles = Object.entries(countBy(profiles, (c) => c.role)).sort((a, b) => b[1] - a[1]);
  const levels = countBy(profiles, (c) => c.experience);
  const cities = [...new Set(profiles.map((c) => c.currentLocation.split(',')[0].trim()))];
  const industries = [...new Set(profiles.map((c) => c.industry))];
  const avgYears = n ? Math.round((profiles.reduce((s, c) => s + c.years, 0) / n) * 10) / 10 : 0;
  const quick = profiles.filter((c) => c.noticePeriod === 'Immediate' || c.noticePeriod === '15 Days').length;
  const visible = showAll ? profiles : profiles.slice(0, 4);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft transition duration-300 hover:shadow-card">
      <div className={cx('relative bg-gradient-to-br p-6 text-white', theme.grad)}>
        <div className="absolute inset-0 bg-dots opacity-70" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold leading-snug tracking-tight">{bundle.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">{bundle.blurb}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-sm font-extrabold text-slate-900 shadow-lg">{bundle.discount}% OFF</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        {n === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No profiles currently match this bundle — check back as new candidates are verified.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <BundleStat icon={Users} value={n} label={n === 1 ? 'Profile' : 'Profiles'} tone="bg-indigo-100 text-indigo-600" />
              <BundleStat icon={Briefcase} value={`${avgYears}y`} label="Avg experience" tone="bg-emerald-100 text-emerald-600" />
              <BundleStat icon={MapPin} value={cities.length} label={cities.length === 1 ? 'City' : 'Cities'} tone="bg-amber-100 text-amber-600" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-widest text-slate-400"><span>Experience mix</span><span>{quick} can join in ≤ 15 days</span></div>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                {EXP_LEVELS.filter((l) => levels[l]).map((l) => <div key={l} className={EXP_BAR[l]} style={{ width: `${(levels[l] / n) * 100}%` }} title={`${l}: ${levels[l]}`} />)}
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                {EXP_LEVELS.filter((l) => levels[l]).map((l) => <li key={l} className="flex items-center gap-1.5"><span className={cx('h-2.5 w-2.5 rounded-full', EXP_BAR[l])} />{l} <b className="text-slate-900">{levels[l]}</b></li>)}
              </ul>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Roles included</div>
              <div className="flex flex-wrap gap-1.5">
                {roles.map(([r, c]) => <span key={r} className={cx('rounded-full px-3 py-1.5 text-xs font-bold', theme.soft)}>{r} <span className="opacity-70">×{c}</span></span>)}
              </div>
              <p className="mt-2 text-xs text-slate-500"><b className="text-slate-700">{industries.join(', ')}</b> · based in {cities.slice(0, 5).join(', ')}{cities.length > 5 && ` +${cities.length - 5} more`}</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-widest text-slate-400"><span>Candidates inside</span><span className="flex items-center gap-1 normal-case tracking-normal"><ShieldCheck size={12} className="text-emerald-500" /> contacts unlock on purchase</span></div>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
                {visible.map((c) => {
                  const th = THEMES[categories.find((x) => x.name === c.industry)?.color] || THEMES.indigo;
                  return (
                    <li key={c.id} className="flex items-center gap-3 bg-white px-3.5 py-3">
                      <Avatar name={c.name} grad={th.grad} size="h-9 w-9" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="truncate font-mono text-[13px] font-bold tracking-wide text-slate-800">{maskName(c.name)}</span><Lock size={11} className="shrink-0 text-slate-300" /></div>
                        <div className="truncate text-xs text-slate-500"><b className="font-bold text-slate-700">{c.role}</b> · {c.currentLocation.split(',')[0]}</div>
                      </div>
                      <div className="hidden shrink-0 text-right text-xs sm:block">
                        <div className="font-bold text-slate-700">{c.experience} · {c.years}y</div>
                        <div className="flex items-center justify-end gap-1 text-slate-500"><Clock size={11} />{c.noticePeriod}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {n > 4 && <button onClick={() => setShowAll((s) => !s)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-full py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"><ChevronDown size={14} className={cx('transition-transform', showAll && 'rotate-180')} />{showAll ? 'Show fewer' : `Show all ${n} candidates`}</button>}
            </div>
          </>
        )}

        <div className="mt-auto rounded-2xl bg-brand-soft p-4 ring-1 ring-indigo-100">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {n > 0 && <div className="text-xs text-slate-500"><span className="line-through">{fmtINR(gross)}</span> · you save <b className="text-emerald-600">{fmtINR(saved)}</b></div>}
              <div className="text-3xl font-extrabold tracking-tight text-slate-900">{fmtINR(price)}</div>
              {n > 0 && <div className="text-xs font-semibold text-slate-500">{fmtINR2(price / n)} per profile</div>}
            </div>
            {added ? <Btn variant="success" size="lg" icon={Check} onClick={() => setCartOpen(true)}>In cart</Btn>
              : <Btn size="lg" icon={Plus} disabled={!n} onClick={() => addBundle(bundle.id)}>{n ? `Add ${n} profile${n > 1 ? 's' : ''}` : 'Unavailable'}</Btn>}
          </div>
        </div>
      </div>
    </article>
  );
}

export function BundlesTab() {
  const { resolveBundle } = useApp();
  const totals = BUNDLES.map((b) => resolveBundle(b).length);
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-brand-soft p-6 ring-1 ring-indigo-100 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Dataset bundles — buy in bulk, save up to 20%</h2>
          <p className="mt-1 text-sm text-slate-600">Hand-picked candidate sets priced live from current rates. Every bundle shows exactly who is inside before you buy.</p>
        </div>
        <div className="flex shrink-0 gap-3">
          {[[BUNDLES.length, 'Bundles'], [Math.max(...totals, 0), 'Largest set']].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-white px-5 py-3 text-center shadow-soft"><div className="text-2xl font-extrabold text-slate-900">{v}</div><div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{l}</div></div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">{BUNDLES.map((b, i) => <BundleCard key={b.id} bundle={b} index={i} />)}</div>
    </div>
  );
}
/* -------------------------------- purchases ------------------------------- */

export function PurchasesTab() {
  const { purchasedIds, candidates, orders, exportLeads, categories, wallet } = useApp();
  const mine = orders.filter((o) => o.mine);
  const owned = candidates.filter((c) => purchasedIds.includes(c.id));
  if (!owned.length && !mine.length)
    return <EmptyState icon={Lock} title="Nothing unlocked yet" text="Purchased profiles show full names, emails, phone numbers and resume links here, ready to export." action={<Btn as={Link} to="/marketplace">Browse the marketplace</Btn>} />;
  const mineIds = mine.map((o) => o.id);
  return (
    <div className="space-y-8">
      {wallet.bought > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Coins size={20} /></span><div><div className="font-extrabold text-slate-900">{wallet.credits.toLocaleString('en-IN')} credits left</div><div className="text-xs text-slate-500">{wallet.bought.toLocaleString('en-IN')} bought · {(wallet.bought - wallet.credits).toLocaleString('en-IN')} used</div></div></div>
          <div className="flex gap-2"><Btn as={Link} to="/marketplace" size="sm" variant="dark" icon={Unlock}>Unlock profiles</Btn><Btn as={Link} to="/marketplace/packages" size="sm" variant="outline" icon={Plus}>Top up</Btn></div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-500/20 md:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Unlock size={20} /> {owned.length} profile{owned.length !== 1 && 's'} unlocked</h2>
          <p className="text-sm text-emerald-50">Full contact details are visible below.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="white" icon={Download} onClick={() => exportLeads(purchasedIds, 'CSV', 'all-purchased-leads', mineIds)}>Export CSV</Btn>
          <Btn variant="glass" icon={FileSpreadsheet} onClick={() => exportLeads(purchasedIds, 'Excel', 'all-purchased-leads', mineIds)}>Excel</Btn>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {owned.map((c) => {
          const theme = THEMES[categories.find((x) => x.name === c.industry)?.color] || THEMES.indigo;
          return (
            <article key={c.id} className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-soft">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} unlocked grad={theme.grad} size="h-12 w-12" />
                  <div className="min-w-0 flex-1"><h3 className="truncate font-extrabold text-slate-900">{c.name}</h3><p className="truncate text-xs text-slate-500">{c.role} · {c.industry}</p></div>
                  <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"><Mail size={14} /> <span className="truncate">{c.email}</span></a>
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"><Phone size={14} /> {c.phone}</a>
                  <a href={c.resume} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"><ExternalLink size={14} /> <span className="truncate">{c.resume}</span></a>
                  <p className="flex items-center gap-2.5 px-1 text-slate-600"><MapPin size={14} className="text-slate-400" /> {c.currentLocation} → {c.preferredLocation}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">{c.skills.map((s) => <span key={s} className={cx('rounded-lg px-2 py-1 text-[11px] font-bold', theme.soft)}>{s}</span>)}</div>
              </div>
            </article>
          );
        })}
      </div>

      {mine.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-extrabold text-slate-900">Order receipts</h3>
          <div className="space-y-3">
            {mine.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
                <div>
                  <div className="flex items-center gap-2 font-extrabold text-slate-900"><Receipt size={16} className="text-slate-400" /> {o.id} <Badge tone="emerald">Paid</Badge></div>
                  <p className="mt-0.5 text-xs text-slate-500">{fmtDateTime(o.date)} · {o.method} · {orderSummary(o)} · {o.kind === 'redeem' ? 'paid with credits' : fmtINR2(o.total)}</p>
                </div>
                {o.candidateIds.length > 0 && <div className="flex gap-2">
                  <Btn size="sm" variant="soft" icon={Download} onClick={() => exportLeads(o.candidateIds, 'CSV', `leads-${o.id}`, [o.id])}>CSV</Btn>
                  <Btn size="sm" variant="outline" icon={FileSpreadsheet} onClick={() => exportLeads(o.candidateIds, 'Excel', `leads-${o.id}`, [o.id])}>Excel</Btn>
                </div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


/* ------------------------------ bulk packages ----------------------------- */

const PKG_STYLES = [
  { grad: 'from-sky-500 to-blue-500', icon: Zap },
  { grad: 'from-emerald-500 to-teal-500', icon: Coins },
  { grad: 'from-indigo-500 via-violet-500 to-fuchsia-500', icon: Crown },
  { grad: 'from-amber-500 to-orange-500', icon: Layers },
  { grad: 'from-rose-500 to-pink-500', icon: Sparkles },
];

export function PackagesTab() {
  const { packages, wallet, avgSinglePrice, addPackageToCart, setCartOpen, cartItems } = useApp();
  const sorted = useMemo(() => [...packages].sort((a, b) => a.contacts - b.contacts), [packages]);
  const saving = (p) => (avgSinglePrice > 0 ? Math.max(0, Math.round((1 - p.price / p.contacts / avgSinglePrice) * 100)) : 0);
  const bestSaving = sorted.length ? Math.max(...sorted.map(saving)) : 0;
  const buy = (id) => { addPackageToCart(id); setCartOpen(true); };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white md:p-9">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-amber-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <Badge tone="dark" icon={Layers} className="bg-white/10 text-amber-200 ring-1 ring-white/20">Bulk contact packages</Badge>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">Buy contacts by the hundred. <span className="bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">Pay up to {bestSaving}% less.</span></h2>
            <p className="mt-3 text-slate-300">One credit unlocks one candidate — any industry, any seniority. Credits never expire and work across the whole catalog.</p>
          </div>
          <div className="shrink-0 rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur md:min-w-[220px]">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-200"><Coins size={14} /> Your balance</div>
            <div className="mt-1 text-4xl font-extrabold tracking-tight">{wallet.credits.toLocaleString('en-IN')}</div>
            <div className="text-sm text-slate-300">contact credits</div>
            {wallet.credits > 0 && <Btn as={Link} to="/marketplace" size="sm" variant="white" icon={Unlock} className="mt-3">Unlock profiles</Btn>}
          </div>
        </div>
      </div>

      <div className="grid gap-5 pt-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p, i) => {
          const st = PKG_STYLES[i % PKG_STYLES.length];
          const rate = p.price / p.contacts;
          const inCartQty = cartItems.find((x) => x.packageId === p.id)?.qty || 0;
          return (
            <article key={p.id} className={cx('relative flex flex-col rounded-3xl bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card', p.popular ? 'ring-2 ring-indigo-500' : 'border border-slate-200/80')}>
              {p.popular && <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/30">Most popular</span>}
              <div className={cx('relative overflow-hidden rounded-t-3xl bg-gradient-to-br p-6 text-white', st.grad)}>
                <div className="absolute inset-0 bg-dots opacity-70" />
                <div className="relative flex items-start justify-between">
                  <div><div className="text-sm font-bold text-white/80">{p.name}</div><div className="mt-1 text-4xl font-extrabold tracking-tight">{p.contacts.toLocaleString('en-IN')}</div><div className="text-sm font-semibold text-white/90">contacts</div></div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"><st.icon size={24} /></span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-end justify-between gap-3">
                  <div><div className="text-3xl font-extrabold tracking-tight text-slate-900">{fmtINR(p.price)}</div><div className="text-sm font-semibold text-slate-500">{fmtINR2(rate)} per contact</div></div>
                  {saving(p) > 0 && <Badge tone="emerald" icon={Sparkles}>Save {saving(p)}%</Badge>}
                </div>
                <p className="mt-3 text-sm text-slate-500">{p.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {['Instant unlock — name, email, phone', 'Any industry, any seniority', 'CSV & Excel export', 'Credits never expire'].map((x) => (
                    <li key={x} className="flex items-center gap-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={12} strokeWidth={3} /></span>{x}</li>
                  ))}
                </ul>
                <Btn size="lg" variant={p.popular ? 'primary' : 'dark'} className="mt-6 w-full" icon={inCartQty ? Check : Plus} onClick={() => buy(p.id)}>{inCartQty ? `In cart ×${inCartQty} · add more` : 'Buy package'}</Btn>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft md:p-8">
        <h3 className="text-xl font-extrabold tracking-tight text-slate-900">How credits work</h3>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[[Coins, 'Buy a package', 'Pick the volume you need. Pay once by card, UPI or bank transfer.', 'from-amber-500 to-orange-500'], [Search, 'Find the right people', 'Filter by skill, role, location and notice period — free to browse.', 'from-indigo-500 to-violet-500'], [Unlock, 'Unlock with 1 credit', 'Unlock one profile, or every match at once. Export to CSV or Excel.', 'from-emerald-500 to-teal-500']].map(([Icon, t, d, g], i) => (
            <div key={t} className="flex gap-4">
              <span className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', g)}><Icon size={22} /></span>
              <div><div className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Step {i + 1}</div><h4 className="font-extrabold text-slate-900">{t}</h4><p className="mt-0.5 text-sm text-slate-500">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr>{['Package', 'Contacts', 'Price', 'Per contact', 'You save vs single buys'].map((h) => <th key={h} className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((p) => (
              <tr key={p.id}><td className="px-5 py-3.5 font-extrabold text-slate-900">{p.name}{p.popular && <Badge tone="indigo" className="ml-2">Popular</Badge>}</td><td className="px-5 py-3.5 text-slate-700">{p.contacts.toLocaleString('en-IN')}</td><td className="px-5 py-3.5 font-extrabold text-slate-900">{fmtINR(p.price)}</td><td className="px-5 py-3.5 text-slate-700">{fmtINR2(p.price / p.contacts)}</td><td className="px-5 py-3.5 font-bold text-emerald-600">{saving(p)}%</td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-center text-sm text-slate-500">Need more than {sorted.length ? Math.max(...sorted.map((p) => p.contacts)).toLocaleString('en-IN') : 0} contacts or a custom plan? <a href="mailto:hello@seekerexchange.example" className="font-bold text-indigo-600 hover:underline">Talk to us</a>.</p>
    </div>
  );
}