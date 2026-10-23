import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Download, ExternalLink, FileSpreadsheet, LayoutGrid, Lock, Mail, MapPin,
  Package, Phone, Plus, Receipt, Search, ShieldCheck, SlidersHorizontal, Sparkles, Table2, Unlock, Users, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { BUNDLES, EXP_LEVELS, PRICE_TIERS, THEMES, THEME_KEYS } from '../lib/data.js';
import { cx, fmtDateTime, fmtINR, maskName, round2 } from '../lib/utils.js';
import { Avatar, Badge, Btn, EmptyState, Reveal, Sheet } from '../components/ui.jsx';
import { CandidateCard, CandidateTable, DEFAULT_FILTERS, FilterPanel } from '../components/market.jsx';
import { iconFor } from '../components/ui.jsx';

/* ------------------------------ page shell ------------------------------ */

export default function Marketplace() {
  const { candidates, categories, purchasedIds, orders } = useApp();
  const active = candidates.filter((c) => c.status === 'Active').length;
  const minPrice = 5;
  const tabs = [
    { to: '/marketplace', label: 'Catalog', end: true, icon: LayoutGrid },
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
            {[[Users, `${active} verified profiles`], [Package, `${categories.length} industries`], [Receipt, `${orders.length} orders fulfilled`], [Sparkles, `From $${minPrice} per lead`]].map(([Icon, t]) => (
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
  const { candidates, categories, isUnlocked, priceOf } = useApp();
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

function BundleCard({ bundle, index }) {
  const { resolveBundle, priceOf, addBundle, cartItems, setCartOpen } = useApp();
  const [open, setOpen] = useState(false);
  const theme = THEMES[THEME_KEYS[index % THEME_KEYS.length]];
  const profiles = resolveBundle(bundle);
  const gross = profiles.reduce((s, c) => s + priceOf(c), 0);
  const price = round2((gross * (100 - bundle.discount)) / 100);
  const added = cartItems.some((i) => i.key === `bundle:${bundle.id}`);
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className={cx('relative bg-gradient-to-br p-5 text-white', theme.grad)}>
        <div className="absolute inset-0 bg-dots opacity-70" />
        <div className="relative flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"><Package size={24} /></div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900 shadow">{bundle.discount}% OFF</span>
        </div>
        <h3 className="relative mt-4 text-lg font-extrabold leading-snug tracking-tight">{bundle.name}</h3>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-slate-500">{bundle.blurb}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="indigo" icon={Users}>{profiles.length} profile{profiles.length !== 1 && 's'}</Badge>
          {[...new Set(profiles.map((c) => c.role))].slice(0, 2).map((r) => <Badge key={r}>{r}</Badge>)}
        </div>
        <button onClick={() => setOpen((o) => !o)} className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600">
          <ChevronDown size={14} className={cx('transition-transform', open && 'rotate-180')} /> {open ? 'Hide' : 'See'} what's inside
        </button>
        {open && (
          <ul className="mt-2 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-3.5 text-xs">
            {profiles.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 truncate"><span className="font-mono text-slate-400">{maskName(c.name)}</span> · <span className="font-bold text-slate-700">{c.role}</span></span>
                <span className="shrink-0 text-slate-500">{c.experience} · {c.currentLocation.split(',')[0]}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <div>
            {profiles.length > 0 && <div className="text-xs text-slate-400 line-through">{fmtINR(gross)}</div>}
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">{fmtINR(price)}</div>
          </div>
          {added ? <Btn variant="success" icon={Check} onClick={() => setCartOpen(true)}>In cart</Btn>
            : <Btn icon={Plus} disabled={!profiles.length} onClick={() => addBundle(bundle.id)}>{profiles.length ? 'Add bundle' : 'Unavailable'}</Btn>}
        </div>
      </div>
    </article>
  );
}

export function BundlesTab() {
  return (
    <div>
      <div className="mb-6 rounded-3xl bg-brand-soft p-6 ring-1 ring-indigo-100">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Buy in bulk, save up to 20%</h2>
        <p className="mt-1 text-sm text-slate-600">Curated industry datasets, priced live from current profile rates. Contents refresh as new candidates are verified.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{BUNDLES.map((b, i) => <BundleCard key={b.id} bundle={b} index={i} />)}</div>
    </div>
  );
}

/* -------------------------------- purchases ------------------------------- */

export function PurchasesTab() {
  const { purchasedIds, candidates, orders, exportLeads, categories } = useApp();
  const mine = orders.filter((o) => o.mine);
  const owned = candidates.filter((c) => purchasedIds.includes(c.id));
  if (!owned.length && !mine.length)
    return <EmptyState icon={Lock} title="Nothing unlocked yet" text="Purchased profiles show full names, emails, phone numbers and resume links here, ready to export." action={<Btn as={Link} to="/marketplace">Browse the marketplace</Btn>} />;
  const mineIds = mine.map((o) => o.id);
  return (
    <div className="space-y-8">
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
                  <p className="mt-0.5 text-xs text-slate-500">{fmtDateTime(o.date)} · {o.method} · {o.candidateIds.length} profiles · ${o.total.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Btn size="sm" variant="soft" icon={Download} onClick={() => exportLeads(o.candidateIds, 'CSV', `leads-${o.id}`, [o.id])}>CSV</Btn>
                  <Btn size="sm" variant="outline" icon={FileSpreadsheet} onClick={() => exportLeads(o.candidateIds, 'Excel', `leads-${o.id}`, [o.id])}>Excel</Btn>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
