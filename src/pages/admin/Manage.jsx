import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Download, Package, Pencil, Plus, Receipt, Search, Trash2, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { EXP_LEVELS, STATUSES, THEMES, THEME_KEYS } from '../../lib/data.js';
import { toCandidateData, validateCandidate } from '../../lib/forms.js';
import { buildCsv, cx, downloadFile, fmtDate, fmtDateTime, fmtINR, fmtINR2 } from '../../lib/utils.js';
import { PersonalFields, ProfessionalFields, SearchStatusFields } from '../../components/CandidateFields.jsx';
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, IndustryTile, Modal, NumberField, PillGroup, TextInput,
} from '../../components/ui.jsx';

/* ============================== PRICING & ROLES ============================ */

function RoleChips({ cat }) {
  const { addRole, deleteRole } = useApp();
  const [text, setText] = useState('');
  const t = THEMES[cat.color] || THEMES.indigo;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {cat.roles.map((r) => (
          <span key={r} className={cx('inline-flex items-center gap-1 rounded-full py-1.5 pl-3 pr-1.5 text-xs font-bold', t.soft)}>
            {r}<button onClick={() => deleteRole(cat.id, r)} aria-label={`Delete ${r}`} className="rounded-full p-0.5 opacity-60 hover:bg-white/70 hover:opacity-100"><X size={12} /></button>
          </span>
        ))}
        {!cat.roles.length && <span className="text-xs text-slate-400">No roles yet</span>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); addRole(cat.id, text); setText(''); }} className="mt-3 flex gap-2">
        <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a sub-job role…" className="!h-10" />
        <Btn type="submit" variant="soft" icon={Plus} disabled={!text.trim()}>Add</Btn>
      </form>
    </div>
  );
}

function CategoryEditor({ cat }) {
  const { renameCategory, setRarity, setCategoryColor, deleteCategory, candidates } = useApp();
  const [name, setName] = useState(cat.name);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setName(cat.name), [cat.name]);
  const used = candidates.filter((c) => c.industry === cat.name).length;
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <IndustryTile cat={cat} size="h-12 w-12" iconSize={21} />
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_130px]">
          <Field label="Business category">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} onBlur={() => { if (!renameCategory(cat.id, name)) setName(cat.name); }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className="!h-10" />
          </Field>
          <Field label="Rarity" as="div"><NumberField value={cat.rarity} step={0.05} min={0.1} prefix="×" onCommit={(v) => setRarity(cat.id, v)} className="[&_input]:!h-10" /></Field>
        </div>
        <button onClick={() => (used ? deleteCategory(cat.id) : setConfirm(true))} aria-label="Delete category" className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
      </div>
      <div className="mb-4 mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{used} candidate{used !== 1 && 's'} · {cat.roles.length} roles</p>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Colour">
          {THEME_KEYS.map((k) => (
            <button key={k} role="radio" aria-checked={cat.color === k} aria-label={k} onClick={() => setCategoryColor(cat.id, k)}
              className={cx('h-5 w-5 rounded-full ring-offset-2 transition', cat.color === k ? 'ring-2 ring-slate-400' : 'hover:scale-110')} style={{ background: THEMES[k].hex }} />
          ))}
        </div>
      </div>
      <RoleChips cat={cat} />
      <ConfirmDialog open={confirm} title="Delete category?" message={`"${cat.name}" and its ${cat.roles.length} roles will be removed.`} onCancel={() => setConfirm(false)} onConfirm={() => { deleteCategory(cat.id); setConfirm(false); }} />
    </div>
  );
}

export function PricingPage() {
  const { pricing, setBasePrice, categories, addCategory } = useApp();
  const [newName, setNewName] = useState('');
  const [newRarity, setNewRarity] = useState(1);
  const gradByLevel = { Entry: 'from-sky-500 to-blue-500', Mid: 'from-emerald-500 to-teal-500', Senior: 'from-indigo-500 to-violet-500', Lead: 'from-fuchsia-500 to-pink-500' };
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2" title="Base price per profile" subtitle="By experience level (USD)">
          <div className="grid grid-cols-2 gap-4">
            {EXP_LEVELS.map((l) => (
              <div key={l} className="rounded-2xl border border-slate-200 p-3.5">
                <div className="mb-2 flex items-center gap-2"><span className={cx('h-2.5 w-2.5 rounded-full bg-gradient-to-br', gradByLevel[l])} /><span className="text-sm font-extrabold text-slate-800">{l}</span></div>
                <NumberField value={pricing.base[l]} min={1} prefix="$" onCommit={(v) => setBasePrice(l, v)} className="[&_input]:!h-11 [&_input]:text-lg [&_input]:font-extrabold" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Final price = base × industry rarity, rounded to the nearest dollar. Edits flow instantly to the storefront, carts and bundles.</p>
        </Card>

        <Card className="xl:col-span-3" title="Live price matrix" subtitle="What buyers will see">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead><tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="pb-3">Industry</th>{EXP_LEVELS.map((l) => <th key={l} className="pb-3 text-right">{l}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3"><div className="flex items-center gap-2.5"><IndustryTile cat={c} size="h-8 w-8" iconSize={14} className="!rounded-xl" /><span className="font-bold text-slate-800">{c.name}</span><span className="text-xs text-slate-400">×{c.rarity}</span></div></td>
                    {EXP_LEVELS.map((l) => <td key={l} className="py-3 text-right font-extrabold text-slate-900">{fmtINR(Math.max(1, Math.round(pricing.base[l] * c.rarity)))}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Add business category">
        <form onSubmit={(e) => { e.preventDefault(); addCategory(newName, newRarity); setNewName(''); setNewRarity(1); }} className="flex flex-wrap items-end gap-3">
          <Field label="Category name" className="min-w-[220px] flex-1"><TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Education & EdTech" /></Field>
          <Field label="Rarity multiplier" as="div" className="w-36"><NumberField value={newRarity} step={0.05} min={0.1} prefix="×" onCommit={setNewRarity} /></Field>
          <Btn type="submit" icon={Plus} size="lg" disabled={!newName.trim()}>Create</Btn>
        </form>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">{categories.map((c) => <CategoryEditor key={c.id} cat={c} />)}</div>
    </div>
  );
}

/* ================================ CANDIDATES =============================== */

function CandidateEditModal({ candidate, onClose }) {
  const { updateCandidate, toast } = useApp();
  const [form, setForm] = useState(() => ({ ...candidate, years: String(candidate.years), ctcAmount: String(candidate.ctcAmount) }));
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const save = () => {
    const errs = validateCandidate(form, [1, 2, 3]);
    setErrors(errs);
    if (Object.keys(errs).length) return toast('Fix the highlighted fields', 'error');
    updateCandidate(candidate.id, toCandidateData(form));
    toast(`${candidate.id} updated`);
    onClose();
  };
  const H = ({ children }) => <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{children}</h4>;
  return (
    <Modal open onClose={onClose} title={`Edit ${candidate.id}`} subtitle="Admins see unmasked data" maxWidth="md:max-w-3xl"
      footer={<div className="flex justify-end gap-2"><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn icon={Check} onClick={save}>Save changes</Btn></div>}>
      <div className="space-y-7">
        <Field label="Status" as="div"><PillGroup options={STATUSES} value={form.status} onChange={(v) => set('status', v)} small /></Field>
        <section><H>Personal</H><PersonalFields f={form} set={set} errors={errors} /></section>
        <section><H>Professional</H><ProfessionalFields f={form} set={set} errors={errors} /></section>
        <section><H>Job search</H><SearchStatusFields f={form} set={set} errors={errors} /></section>
      </div>
    </Modal>
  );
}

export function CandidatesPage() {
  const { candidates, categories, updateCandidate, deleteCandidate, priceOf, orders, toast } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const sales = useMemo(() => {
    const m = {};
    orders.forEach((o) => o.candidateIds.forEach((id) => { m[id] = (m[id] || 0) + 1; }));
    return m;
  }, [orders]);
  const themeFor = (c) => THEMES[categories.find((x) => x.name === c.industry)?.color] || THEMES.indigo;

  const rows = candidates.filter((c) => {
    if (status !== 'All' && c.status !== status) return false;
    const s = q.toLowerCase().trim();
    return !s || [c.id, c.name, c.email, c.phone, c.role, c.industry, c.currentLocation].join(' ').toLowerCase().includes(s);
  });
  const countOf = (s) => (s === 'All' ? candidates.length : candidates.filter((c) => c.status === s).length);

  const setStatusFor = (c, s) => { updateCandidate(c.id, { status: s }); toast(`${c.id} → ${s}`); };
  const statusCls = (s) => (s === 'Active' ? 'bg-emerald-50 text-emerald-700' : s === 'Pending Verification' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600');
  const StatusSelect = ({ c }) => (
    <select value={c.status} onChange={(e) => setStatusFor(c, e.target.value)} aria-label={`Status for ${c.id}`} className={cx('rounded-full border-0 py-1.5 pl-3 pr-7 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30', statusCls(c.status))}>
      {STATUSES.map((s) => <option key={s}>{s}</option>)}
    </select>
  );
  const Actions = ({ c }) => (
    <div className="flex items-center justify-end gap-1">
      {c.status === 'Pending Verification' && <Btn size="sm" variant="success" icon={Check} onClick={() => setStatusFor(c, 'Active')}>Verify</Btn>}
      <button onClick={() => setEditing(c)} aria-label="Edit" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button>
      <button onClick={() => setDeleting(c)} aria-label="Delete" className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
    </div>
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name, email, role…" className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-base shadow-soft focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 md:text-[15px]" />
        </div>
        <Btn variant="outline" size="lg" icon={Download} onClick={() => { downloadFile('candidate-master.csv', 'text/csv;charset=utf-8', buildCsv(rows)); toast(`${rows.length} candidates exported`); }}>Export</Btn>
      </div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {['All', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cx('inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition', status === s ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200')}>
            {s}<span className={cx('rounded-full px-1.5 text-[11px]', status === s ? 'bg-white/20' : 'bg-slate-100')}>{countOf(s)}</span>
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-soft md:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr>{['ID', 'Candidate', 'Role', 'Level', 'Price', 'Sold', 'Status', ''].map((h) => <th key={h} className="px-4 py-3.5">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((c) => (
              <tr key={c.id} className="transition hover:bg-indigo-50/30">
                <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{c.id}</td>
                <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Avatar name={c.name} grad={themeFor(c).grad} size="h-9 w-9" /><div className="min-w-0"><div className="font-bold text-slate-900">{c.name}</div><div className="truncate text-xs text-slate-500">{c.email} · {c.phone}</div></div></div></td>
                <td className="px-4 py-3.5"><div className="font-semibold text-slate-800">{c.role}</div><span className={cx('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold', themeFor(c).soft)}>{c.industry}</span></td>
                <td className="px-4 py-3.5 text-slate-600">{c.experience} · {c.years}y</td>
                <td className="px-4 py-3.5 font-extrabold text-slate-900">{fmtINR(priceOf(c))}</td>
                <td className="px-4 py-3.5 text-slate-600">{sales[c.id] || 0}</td>
                <td className="px-4 py-3.5"><StatusSelect c={c} /></td>
                <td className="px-4 py-3.5"><Actions c={c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((c) => (
          <div key={c.id} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <Avatar name={c.name} grad={themeFor(c).grad} />
              <div className="min-w-0 flex-1"><p className="truncate font-extrabold text-slate-900">{c.name}</p><p className="truncate text-xs text-slate-500">{c.role} · {c.industry}</p></div>
              <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
            </div>
            <p className="mt-2 truncate text-xs text-slate-500">{c.email} · {c.phone}</p>
            <div className="mt-3 flex items-center justify-between gap-2"><StatusSelect c={c} /><span className="text-sm font-extrabold">{fmtINR(priceOf(c))} <span className="text-xs font-medium text-slate-400">· {sales[c.id] || 0} sold</span></span></div>
            <div className="mt-2 border-t border-slate-100 pt-2"><Actions c={c} /></div>
          </div>
        ))}
      </div>
      {rows.length === 0 && <EmptyState icon={Users} title="No candidates found" text="Try a different search or status filter." />}

      {editing && <CandidateEditModal candidate={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!deleting} title="Delete candidate?" message={deleting ? `${deleting.name} (${deleting.id}) will be permanently removed from the marketplace. Past order records are kept.` : ''} onCancel={() => setDeleting(null)} onConfirm={() => { deleteCandidate(deleting.id); toast(`${deleting.id} deleted`); setDeleting(null); }} />
    </div>
  );
}

/* ================================== ORDERS ================================= */

export function OrdersPage() {
  const { orders } = useApp();
  const [open, setOpen] = useState(null);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  if (!orders.length) return <EmptyState icon={Receipt} title="No orders yet" text="Orders appear here as soon as a recruiter checks out." />;
  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[['Orders', orders.length], ['Revenue', fmtINR2(revenue)], ['Downloads', orders.reduce((s, o) => s + o.downloads.length, 0)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-soft"><div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</div><div className="text-xl font-extrabold text-slate-900 md:text-2xl">{v}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[110px_1.4fr_1fr_110px_90px_100px_24px]">
              <span className="font-mono text-xs font-bold text-slate-500">{o.id}{o.mine && <Badge tone="indigo" className="ml-2">You</Badge>}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{o.buyer}</span><span className="block truncate text-xs text-slate-500">{o.company}</span></span>
              <span className="hidden text-xs text-slate-500 md:block">{fmtDateTime(o.date)}</span>
              <span className="hidden text-xs text-slate-600 md:block">{o.method}</span>
              <span className="hidden text-xs text-slate-600 md:block">{o.candidateIds.length} leads</span>
              <span className="text-right text-sm font-extrabold text-slate-900 md:text-left">{fmtINR2(o.total)}</span>
              <ChevronDown size={16} className={cx('hidden text-slate-400 transition-transform md:block', open === o.id && 'rotate-180')} />
              <span className="col-span-2 text-xs text-slate-400 md:hidden">{fmtDate(o.date)} · {o.method} · {o.candidateIds.length} leads · {o.downloads.length} downloads</span>
            </button>
            {open === o.id && (
              <div className="grid animate-fade-in gap-6 border-t border-slate-100 bg-slate-50/70 p-5 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Purchased items</h4>
                  <ul className="space-y-2 text-sm">{o.items.map((i, idx) => <li key={idx} className="flex justify-between gap-3"><span className="truncate text-slate-700">{i.type === 'bundle' && <Package size={13} className="mr-1 inline text-emerald-500" />}{i.name}{i.type === 'bundle' && ` (${i.count} profiles)`}</span><span className="font-bold">{fmtINR(i.price)}</span></li>)}</ul>
                  {o.promoCode && <p className="mt-3 text-xs font-semibold text-emerald-600">Promo {o.promoCode}: −{fmtINR2(o.promoDiscount)}</p>}
                  <p className="mt-2 text-xs text-slate-400">{o.email}</p>
                </div>
                <div>
                  <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Download log ({o.downloads.length})</h4>
                  {o.downloads.length ? <ul className="space-y-2 text-sm text-slate-600">{o.downloads.map((d, idx) => <li key={idx} className="flex items-center gap-2"><Download size={13} className="text-slate-400" /> {d.format} · {fmtDateTime(d.at)}</li>)}</ul> : <p className="text-sm text-slate-400">Dataset not downloaded yet.</p>}
                  <p className="mt-3 break-words text-xs text-slate-400">Candidates: {o.candidateIds.join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
