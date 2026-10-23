import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, Coins, Receipt, SlidersHorizontal, Store, TrendingUp, UserCheck, Users, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { cx, fmtDate, fmtINR, fmtINR2, orderSummary, round2 } from '../../lib/utils.js';
import { Avatar, Badge, Btn, Card, IndustryTile } from '../../components/ui.jsx';

function StatCard({ icon: Icon, label, value, sub, grad }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft md:p-6">
      <div className={cx('pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-15 blur-xl', grad)} />
      <div className={cx('relative mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', grad)}><Icon size={20} /></div>
      <div className="relative text-3xl font-extrabold tracking-tight text-slate-900 md:text-[34px]">{value}</div>
      <div className="relative mt-0.5 text-sm font-bold text-slate-500">{label}</div>
      {sub && <div className="relative mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

/* ----------------------------- revenue chart ----------------------------- */

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function RevenueChart({ points }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 250, pad = { l: 48, r: 16, t: 16, b: 30 };
  const n = points.length;
  const rawMax = Math.max(...points.map((p) => p.value), 0);
  const pow = 10 ** Math.floor(Math.log10(Math.max(rawMax, 1) / 2));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s * 2 >= rawMax) || pow * 10;
  const max = Math.max(step * 2, Math.ceil(rawMax / step) * step);
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(n - 1, 1);
  const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const ticks = [0, max / 2, max];
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx0 = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const vx = (cx0 / rect.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((vx - pad.l) / (W - pad.l - pad.r)) * (n - 1)))));
  };
  const hp = hover != null ? points[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" role="img" aria-label="Revenue by day" onMouseMove={onMove} onTouchMove={onMove} onMouseLeave={() => setHover(null)} onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity=".32" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? '' : '3 4'} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8" fontWeight="600">{t >= 1000 ? `₹${t / 1000}k` : `₹${Math.round(t)}`}</text>
          </g>
        ))}
        <path d={area} fill="url(#rev)" />
        <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => i % Math.ceil(n / 7) === 0 && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600">{p.label}</text>)}
        {hp && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#94a3b8" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(hp.value)} r="5.5" fill="#4f46e5" stroke="#fff" strokeWidth="2.5" />
          </g>
        )}
        {!hp && <circle cx={x(n - 1)} cy={y(points[n - 1].value)} r="4.5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />}
      </svg>
      {hp && (
        <div className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl" style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}>
          <div className="font-bold text-slate-300">{hp.full}</div>
          <div className="text-sm font-extrabold">{fmtINR2(hp.value)}</div>
          <div className="text-slate-400">{hp.orders} order{hp.orders !== 1 && 's'} · {hp.leads} lead{hp.leads !== 1 && 's'}</div>
        </div>
      )}
      <table className="sr-only"><caption>Revenue by day</caption><tbody>{points.map((p) => <tr key={p.full}><td>{p.full}</td><td>{p.value}</td></tr>)}</tbody></table>
    </div>
  );
}

/* -------------------------------- dashboard ------------------------------ */

export default function Dashboard() {
  const { candidates, orders, categories, updateCandidate, toast } = useApp();
  const [range, setRange] = useState(14);
  const paidOrders = orders.filter((o) => o.kind !== 'redeem');
  const leadsSold = orders.reduce((s, o) => s + o.candidateIds.length, 0);
  const creditsSold = orders.reduce((s, o) => s + (o.credits || 0), 0);
  const revenue = round2(orders.reduce((s, o) => s + o.total, 0));
  const pending = candidates.filter((c) => c.status === 'Pending Verification');
  const counts = { Active: 0, 'Pending Verification': 0, 'Sold Out': 0 };
  candidates.forEach((c) => { counts[c.status] += 1; });

  const points = useMemo(() => {
    const buckets = new Map();
    orders.forEach((o) => {
      const k = dayKey(new Date(o.date));
      const b = buckets.get(k) || { value: 0, orders: 0, leads: 0 };
      b.value += o.total; b.orders += 1; b.leads += o.candidateIds.length;
      buckets.set(k, b);
    });
    return Array.from({ length: range }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (range - 1 - i));
      const b = buckets.get(dayKey(d)) || { value: 0, orders: 0, leads: 0 };
      return { ...b, value: round2(b.value), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), full: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
    });
  }, [orders, range]);
  const periodTotal = round2(points.reduce((s, p) => s + p.value, 0));

  const byIndustry = useMemo(() => {
    const map = new Map(categories.map((c) => [c.name, { cat: c, leads: 0, revenue: 0 }]));
    orders.forEach((o) => o.lines.forEach((l) => {
      const row = map.get(l.industry);
      if (row) { row.leads += 1; row.revenue += l.paid; }
    }));
    return [...map.values()].sort((a, b) => b.leads - a.leads || b.revenue - a.revenue);
  }, [orders, categories]);
  const max = Math.max(1, ...byIndustry.map((r) => r.leads));
  const total = candidates.length || 1;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-fuchsia-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-60 w-60 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Welcome back, Admin</h2>
            <p className="mt-1 text-slate-300">{pending.length ? `${pending.length} profile${pending.length > 1 ? 's' : ''} waiting for verification.` : 'Everything is verified — nice work.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn as={Link} to="/admin/candidates" variant="white" size="md" icon={UserCheck}>Review candidates</Btn>
            <Btn as={Link} to="/admin/pricing" variant="glass" size="md" icon={SlidersHorizontal}>Edit pricing</Btn>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        <StatCard icon={Users} grad="from-indigo-500 to-violet-500" label="Job seekers registered" value={candidates.length} sub={`${counts.Active} active · ${counts['Pending Verification']} pending`} />
        <StatCard icon={UserCheck} grad="from-emerald-500 to-teal-500" label="Leads sold" value={leadsSold} sub={`${orders.length} orders`} />
        <StatCard icon={Wallet} grad="from-amber-500 to-orange-500" label="Revenue generated" value={fmtINR2(revenue)} sub={paidOrders.length ? `Avg order ${fmtINR2(revenue / paidOrders.length)}` : undefined} />
        <StatCard icon={TrendingUp} grad="from-fuchsia-500 to-pink-500" label="Top industry" value={<span className="text-xl md:text-2xl">{byIndustry[0]?.leads ? byIndustry[0].cat.name : '—'}</span>} sub={byIndustry[0]?.leads ? `${byIndustry[0].leads} leads sold` : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Revenue" subtitle={`${fmtINR2(periodTotal)} in the last ${range} days`}
          action={<div className="flex rounded-full bg-slate-100 p-1">{[7, 14, 30].map((r) => <button key={r} onClick={() => setRange(r)} className={cx('rounded-full px-3 py-1 text-xs font-bold transition', range === r ? 'bg-white text-indigo-700 shadow' : 'text-slate-500')}>{r}d</button>)}</div>}>
          {periodTotal === 0 && <p className="mb-2 text-sm text-slate-400">No sales in this period.</p>}
          <RevenueChart points={points} />
        </Card>

        <Card title="Awaiting verification" action={<Badge tone={pending.length ? 'amber' : 'emerald'}>{pending.length}</Badge>}>
          {pending.length === 0 ? <p className="text-sm text-slate-500">All caught up — no profiles waiting.</p> : (
            <ul className="space-y-3.5">
              {pending.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <Avatar name={c.name} size="h-10 w-10" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{c.name}</p><p className="truncate text-xs text-slate-500">{c.role} · {c.id}</p></div>
                  <Btn size="sm" variant="success" icon={Check} onClick={() => { updateCandidate(c.id, { status: 'Active' }); toast(`${c.id} verified & live`); }}>Verify</Btn>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Profile status</div>
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
              {[['Active', 'bg-emerald-500'], ['Pending Verification', 'bg-amber-400'], ['Sold Out', 'bg-slate-400']].map(([k, c]) => counts[k] > 0 && <div key={k} className={c} style={{ width: `${(counts[k] / total) * 100}%` }} title={`${k}: ${counts[k]}`} />)}
            </div>
            <ul className="mt-3 space-y-1.5 text-xs">
              {[['Active', 'bg-emerald-500'], ['Pending Verification', 'bg-amber-400'], ['Sold Out', 'bg-slate-400']].map(([k, c]) => (
                <li key={k} className="flex items-center justify-between text-slate-600"><span className="flex items-center gap-2"><span className={cx('h-2.5 w-2.5 rounded-full', c)} />{k}</span><b className="text-slate-900">{counts[k]}</b></li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Top selling industries" subtitle="Leads sold, with attributed revenue">
          <ul className="space-y-4">
            {byIndustry.map((r) => (
              <li key={r.cat.id} className="flex items-center gap-3">
                <IndustryTile cat={r.cat} size="h-10 w-10" iconSize={17} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-bold text-slate-800">{r.cat.name}</span>
                    <span className="shrink-0 text-xs text-slate-500"><b className="text-sm text-slate-900">{r.leads}</b> leads · {fmtINR2(r.revenue)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${(r.leads / max) * 100}%` }} /></div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent orders" action={<Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">View all <ArrowRight size={12} /></Link>}>
          <ul className="divide-y divide-slate-100">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Receipt size={17} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{o.buyer} <span className="font-medium text-slate-400">· {o.id}</span></p><p className="truncate text-xs text-slate-500">{o.company} · {orderSummary(o)} · {fmtDate(o.date)}</p></div>
                {o.kind === 'redeem' ? <Badge tone="amber" icon={Coins}>Credits</Badge> : <span className="font-extrabold text-slate-900">{fmtINR2(o.total)}</span>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
