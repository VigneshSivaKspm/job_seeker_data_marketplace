import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Check, CircleCheck, Coins, Minus, Clock, CreditCard, Download, ExternalLink, Eye, FileSpreadsheet, GraduationCap,
  Landmark, Lock, Mail, MapPin, Package, Phone, Plus, Receipt, ShieldCheck, ShoppingBag, Smartphone, Tag, Trash2,
  Unlock, UserCheck, Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { EXP_LEVELS, NOTICE_PERIODS, PAYMENT_METHODS, PRICE_TIERS, PROMOS, THEMES } from '../lib/data.js';
import { validateCheckout } from '../lib/forms.js';
import { cx, fmtDate, fmtDateTime, fmtINR, fmtINR2, formatCtc, maskEmail, maskName, maskPhone, themeOf } from '../lib/utils.js';
import {
  Avatar, Badge, Btn, EmptyState, Fact, Field, Modal, PillGroup, SelectInput, Sheet, Spinner, StatusBadge, TextInput,
} from './ui.jsx';

export const DEFAULT_FILTERS = { q: '', industry: 'All', role: 'All', minExp: 'All', notice: 'All', tier: 'All', sort: 'newest' };

/* ------------------------------ buy button ------------------------------ */

export function BuyButton({ c, size = 'md', className }) {
  const { isUnlocked, inCart, addLead, setCartOpen, priceOf, wallet, unlockWithCredits } = useApp();
  if (isUnlocked(c.id)) return <Badge tone="emerald" icon={Unlock} className="px-3 py-2 text-xs">Unlocked</Badge>;
  if (c.status === 'Sold Out') return <Btn size={size} variant="outline" disabled className={className}>Sold out</Btn>;
  if (wallet.credits > 0)
    return (
      <div className="flex items-center gap-1.5">
        <Btn size={size} variant="success" icon={Unlock} className={className} onClick={(e) => { e.stopPropagation(); unlockWithCredits([c.id]); }}>Unlock · 1 credit</Btn>
        {inCart(c.id)
          ? <button onClick={(e) => { e.stopPropagation(); setCartOpen(true); }} aria-label="In cart" title="In cart" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check size={17} /></button>
          : <button onClick={(e) => { e.stopPropagation(); addLead(c.id); }} aria-label={`Add to cart for ${fmtINR(priceOf(c))}`} title={`Buy for ${fmtINR(priceOf(c))} instead`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"><Plus size={17} /></button>}
      </div>
    );
  if (inCart(c.id)) return <Btn size={size} variant="success" icon={Check} className={className} onClick={(e) => { e.stopPropagation(); setCartOpen(true); }}>In cart</Btn>;
  return (
    <Btn size={size} icon={Plus} className={className} onClick={(e) => { e.stopPropagation(); addLead(c.id); }}>
      Add · {fmtINR(priceOf(c))}
    </Btn>
  );
}
function MaskedLine({ icon: Icon, text, unlocked }) {
  return (
    <div className={cx('flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs', unlocked ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-500')}>
      <Icon size={12} className={unlocked ? 'text-emerald-500' : 'text-slate-400'} />
      <span className={cx('truncate', !unlocked && 'font-mono tracking-wide')}>{text}</span>
    </div>
  );
}

/* --------------------------------- card --------------------------------- */

export function CandidateCard({ c }) {
  const { isUnlocked, setPreviewId, priceOf, categories } = useApp();
  const unlocked = isUnlocked(c.id);
  const theme = themeOf(categories, c.industry);
  return (
    <article
      onClick={() => setPreviewId(c.id)}
      className={cx('group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card',
        unlocked ? 'border-emerald-300' : 'border-slate-200/80 hover:border-indigo-200', c.status === 'Sold Out' && !unlocked && 'opacity-75')}
    >
      <div className={cx('h-1.5 w-full bg-gradient-to-r', unlocked ? 'from-emerald-400 to-teal-400' : theme.grad)} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <Avatar name={c.name} unlocked={unlocked} grad={theme.grad} size="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className={cx('truncate text-[15px] font-extrabold text-slate-900', !unlocked && 'font-mono tracking-wide')}>{unlocked ? c.name : maskName(c.name)}</h3>
              {unlocked ? <Unlock size={13} className="shrink-0 text-emerald-500" /> : <Lock size={13} className="shrink-0 text-slate-400" />}
            </div>
            <p className="font-mono text-[10px] text-slate-400">{c.id}</p>
          </div>
          {c.status === 'Sold Out' && <Badge tone="amber">Sold out</Badge>}
        </div>

        <div className="space-y-1.5">
          <MaskedLine icon={Mail} unlocked={unlocked} text={unlocked ? c.email : maskEmail(c.email)} />
          <MaskedLine icon={Phone} unlocked={unlocked} text={unlocked ? c.phone : maskPhone(c.phone)} />
        </div>

        <div>
          <p className="text-lg font-extrabold leading-tight tracking-tight text-slate-900">{c.role}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', theme.soft)}>{c.industry}</span>
            <Badge tone="slate" icon={Briefcase}>{c.experience} · {c.years}y</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl bg-slate-50/80 p-3.5">
          <Fact icon={MapPin} label="Location" value={c.currentLocation.split(',')[0]} />
          <Fact icon={Wallet} label="Expected" value={formatCtc(c)} />
          <Fact icon={Clock} label="Notice" value={c.noticePeriod} />
          <Fact icon={GraduationCap} label="Education" value={c.education.replace(' Degree', '')} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {c.skills.slice(0, 4).map((s) => <span key={s} className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">{s}</span>)}
          {c.skills.length > 4 && <span className="px-1 py-1 text-[11px] font-bold text-slate-400">+{c.skills.length - 4}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead price</div>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">{fmtINR(priceOf(c))}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); setPreviewId(c.id); }} aria-label="Preview profile" className="hidden h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 sm:flex"><Eye size={17} /></button>
            <BuyButton c={c} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function CandidateTable({ rows }) {
  const { isUnlocked, setPreviewId, priceOf, categories } = useApp();
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-soft">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>{['Candidate', 'Role / Industry', 'Experience', 'Skills', 'Notice', 'Expected', 'Location', 'Price', ''].map((h) => <th key={h} className="px-4 py-3.5">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((c) => {
            const u = isUnlocked(c.id);
            const theme = themeOf(categories, c.industry);
            return (
              <tr key={c.id} onClick={() => setPreviewId(c.id)} className="cursor-pointer transition hover:bg-indigo-50/40">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} unlocked={u} grad={theme.grad} size="h-9 w-9" />
                    <div className="min-w-0">
                      <div className={cx('truncate text-[13px] font-bold text-slate-900', !u && 'font-mono')}>{u ? c.name : maskName(c.name)}</div>
                      <div className={cx('truncate text-xs', u ? 'text-slate-500' : 'font-mono text-slate-400')}>{u ? c.email : maskEmail(c.email)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5"><div className="font-bold text-slate-900">{c.role}</div><span className={cx('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold', theme.soft)}>{c.industry}</span></td>
                <td className="px-4 py-3.5 text-slate-600">{c.experience} · {c.years}y</td>
                <td className="max-w-[200px] px-4 py-3.5 text-xs text-slate-600">{c.skills.slice(0, 3).join(', ')}{c.skills.length > 3 && ` +${c.skills.length - 3}`}</td>
                <td className="px-4 py-3.5 text-slate-600">{c.noticePeriod}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatCtc(c)}</td>
                <td className="px-4 py-3.5 text-slate-600">{c.currentLocation.split(',')[0]}</td>
                <td className="px-4 py-3.5 font-extrabold text-slate-900">{fmtINR(priceOf(c))}</td>
                <td className="px-4 py-3.5 text-right"><BuyButton c={c} size="sm" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------- filters -------------------------------- */

function FilterSection({ title, children }) {
  return (
    <div className="border-b border-slate-100 py-5 first:pt-1 last:border-0 last:pb-1">
      <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{title}</h4>
      {children}
    </div>
  );
}

export function FilterPanel({ filters, setFilters }) {
  const { categories } = useApp();
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v, ...(k === 'industry' ? { role: 'All' } : {}) }));
  const roles = useMemo(
    () => (filters.industry === 'All' ? [...new Set(categories.flatMap((c) => c.roles))].sort() : categories.find((c) => c.name === filters.industry)?.roles || []),
    [categories, filters.industry]
  );
  return (
    <div>
      <FilterSection title="Industry">
        <SelectInput value={filters.industry} onChange={(e) => set('industry', e.target.value)}>
          <option>All</option>
          {categories.map((c) => <option key={c.id}>{c.name}</option>)}
        </SelectInput>
      </FilterSection>
      <FilterSection title="Job role">
        <SelectInput value={filters.role} onChange={(e) => set('role', e.target.value)}>
          <option>All</option>
          {roles.map((r) => <option key={r}>{r}</option>)}
        </SelectInput>
      </FilterSection>
      <FilterSection title="Minimum experience"><PillGroup small options={['All', ...EXP_LEVELS]} value={filters.minExp} onChange={(v) => set('minExp', v)} /></FilterSection>
      <FilterSection title="Notice period"><PillGroup small options={['All', ...NOTICE_PERIODS]} value={filters.notice} onChange={(v) => set('notice', v)} /></FilterSection>
      <FilterSection title="Price tier">
        <div className="space-y-2">
          {[{ id: 'All', range: 'Any price' }, ...PRICE_TIERS].map((t) => (
            <label key={t.id} className={cx('flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition', filters.tier === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300')}>
              <span className="flex items-center gap-2.5">
                <input type="radio" name="tier" checked={filters.tier === t.id} onChange={() => set('tier', t.id)} className="accent-indigo-600" />
                <span className="font-bold text-slate-700">{t.id === 'All' ? 'All tiers' : t.id}</span>
              </span>
              <span className="text-xs text-slate-500">{t.range}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

/* ------------------------------ cart drawer ------------------------------ */

export function CartSheet() {
  const { cartOpen, setCartOpen, cartItems, cartTotals, promo, setPromo, applyPromo, removeFromCart, setPackageQty, setCheckoutOpen } = useApp();
  const [code, setCode] = useState('');
  const promoShort = promo && cartTotals.subtotal < promo.min;
  const sub = [cartTotals.leadCount ? `${cartTotals.leadCount} profile${cartTotals.leadCount > 1 ? 's' : ''}` : '', cartTotals.credits ? `${cartTotals.credits.toLocaleString('en-IN')} contact credits` : ''].filter(Boolean).join(' · ');
  return (
    <Sheet
      open={cartOpen} onClose={() => setCartOpen(false)} title="Your cart"
      subtitle={cartItems.length ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} · ${sub}` : undefined}
      footer={cartItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-end justify-between"><span className="text-sm font-bold text-slate-500">Total</span><span className="text-3xl font-extrabold tracking-tight text-slate-900">{fmtINR2(cartTotals.total)}</span></div>
          <Btn size="xl" className="w-full" icon={Lock} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Secure checkout</Btn>
        </div>
      )}
    >
      {cartItems.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Add individual profiles, save with a bundle, or buy a bulk contact package." action={<Btn as={Link} to="/marketplace/packages" onClick={() => setCartOpen(false)}>See bulk packages</Btn>} />
      ) : (
        <>
          <ul className="space-y-3">
            {cartItems.map((i) => (
              <li key={i.key} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5">
                <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white', i.type === 'bundle' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : i.type === 'package' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-brand')}>
                  {i.type === 'bundle' ? <Package size={19} /> : i.type === 'package' ? <Coins size={19} /> : <UserCheck size={19} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-900">{i.type === 'bundle' ? i.name : i.type === 'package' ? `${i.pkg.name} package` : i.candidate.role}</p>
                  <p className="truncate text-xs text-slate-500">
                    {i.type === 'bundle' && `${i.candidates.length} profiles · ${i.discount}% bundle discount`}
                    {i.type === 'package' && `${i.credits.toLocaleString('en-IN')} credits · ${fmtINR2(i.pkg.price / i.pkg.contacts)}/contact`}
                    {i.type === 'lead' && `${maskName(i.candidate.name)} · ${i.candidate.experience} · ${i.candidate.id}`}
                  </p>
                  {i.type === 'package' && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 p-0.5">
                      <button onClick={() => setPackageQty(i.key, i.qty - 1)} aria-label="Decrease quantity" className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-white"><Minus size={14} /></button>
                      <span className="w-8 text-center text-sm font-extrabold text-slate-900" aria-live="polite">{i.qty}</span>
                      <button onClick={() => setPackageQty(i.key, i.qty + 1)} aria-label="Increase quantity" className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-white"><Plus size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">{fmtINR(i.price)}</div>
                  {i.gross !== i.price && <div className="text-[11px] text-slate-400 line-through">{fmtINR(i.gross)}</div>}
                </div>
                <button onClick={() => removeFromCart(i.key)} aria-label="Remove" className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl bg-brand-soft p-4">
            <h4 className="mb-2.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-indigo-600"><Tag size={13} /> Promo code</h4>
            {promo ? (
              <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-sm shadow-sm">
                <span className="font-bold text-emerald-600">{promo.code} · {promo.pct}% off</span>
                <button onClick={() => setPromo(null)} className="text-xs font-bold text-slate-500 hover:text-rose-500">Remove</button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (code) { applyPromo(code); setCode(''); } }} className="flex gap-2">
                <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" className="uppercase" />
                <Btn type="submit" variant="dark" size="lg">Apply</Btn>
              </form>
            )}
            {promoShort && <p className="mt-2 text-xs font-semibold text-amber-600">Add {fmtINR2(promo.min - cartTotals.subtotal)} more to unlock this code.</p>}
            {!promo && <p className="mt-2 text-xs text-slate-500">Try {Object.keys(PROMOS).join(' · ')}</p>}
          </div>

          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600"><dt>Subtotal</dt><dd className="font-semibold">{fmtINR2(cartTotals.gross)}</dd></div>
            {cartTotals.bundleSavings > 0 && <div className="flex justify-between text-emerald-600"><dt>Bundle savings</dt><dd className="font-semibold">−{fmtINR2(cartTotals.bundleSavings)}</dd></div>}
            {cartTotals.promoDiscount > 0 && <div className="flex justify-between text-emerald-600"><dt>Promo {promo.code}</dt><dd className="font-semibold">−{fmtINR2(cartTotals.promoDiscount)}</dd></div>}
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-extrabold text-slate-900"><dt>Total</dt><dd>{fmtINR2(cartTotals.total)}</dd></div>
          </dl>
        </>
      )}
    </Sheet>
  );
}
/* ------------------------------ preview sheet ---------------------------- */

export function PreviewSheet() {
  const { previewId, setPreviewId, getCandidate, isUnlocked, priceOf, exportLeads, categories } = useApp();
  const c = previewId ? getCandidate(previewId) : null;
  if (!c) return null;
  const unlocked = isUnlocked(c.id);
  const theme = themeOf(categories, c.industry);
  return (
    <Sheet
      open onClose={() => setPreviewId(null)} title={c.role} subtitle={`${c.id} · ${c.industry}`} width="md:w-[500px] lg:w-[580px]"
      footer={
        unlocked ? (
          <div className="flex gap-2">
            <Btn variant="success" size="lg" icon={Download} className="flex-1" onClick={() => exportLeads([c.id], 'CSV', `lead-${c.id}`)}>Export CSV</Btn>
            <Btn variant="outline" size="lg" icon={FileSpreadsheet} className="flex-1" onClick={() => exportLeads([c.id], 'Excel', `lead-${c.id}`)}>Excel</Btn>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead price</div><div className="text-3xl font-extrabold tracking-tight text-slate-900">{fmtINR(priceOf(c))}</div></div>
            <BuyButton c={c} size="lg" />
          </div>
        )
      }
    >
      <div className={cx('relative overflow-hidden rounded-3xl p-5', unlocked ? 'bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-200' : 'bg-brand-soft ring-1 ring-indigo-100')}>
        <div className="flex items-center gap-4">
          <Avatar name={c.name} unlocked={unlocked} grad={theme.grad} size="h-16 w-16 text-lg" />
          <div className="min-w-0">
            <div className={cx('truncate text-xl font-extrabold text-slate-900', !unlocked && 'font-mono')}>{unlocked ? c.name : maskName(c.name)}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5"><Badge tone={unlocked ? 'emerald' : 'slate'} icon={unlocked ? Unlock : Lock}>{unlocked ? 'Contact unlocked' : 'Contact masked'}</Badge><StatusBadge status={c.status} /></div>
          </div>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          {[[Mail, 'Email', unlocked ? c.email : maskEmail(c.email)], [Phone, 'Phone', unlocked ? c.phone : maskPhone(c.phone)], [ExternalLink, 'Resume', unlocked ? c.resume : 'https://•••••••••••••']].map(([Icon, label, val]) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-white/80 px-3.5 py-2.5">
              <Icon size={15} className="text-slate-400" />
              <dt className="w-16 shrink-0 text-xs font-bold text-slate-500">{label}</dt>
              <dd className={cx('min-w-0 truncate', unlocked ? 'font-semibold text-slate-900' : 'font-mono text-slate-400')}>{val}</dd>
            </div>
          ))}
        </dl>
        {!unlocked && <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-600"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" /> The candidate consented to share contact details only with verified recruiters after purchase.</p>}
      </div>

      <h3 className="mb-3 mt-7 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Profile overview</h3>
      <div className="grid grid-cols-2 gap-4">
        <Fact icon={Briefcase} label="Experience" value={`${c.experience} · ${c.years} years`} />
        <Fact icon={Clock} label="Notice period" value={c.noticePeriod} />
        <Fact icon={Wallet} label="Expected CTC / rate" value={formatCtc(c)} />
        <Fact icon={GraduationCap} label="Education" value={c.education} />
        <Fact icon={MapPin} label="Current location" value={c.currentLocation} />
        <Fact icon={MapPin} label="Preferred location" value={c.preferredLocation} />
      </div>

      <h3 className="mb-3 mt-7 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Tech stack & skills</h3>
      <div className="flex flex-wrap gap-2">{c.skills.map((s) => <span key={s} className={cx('rounded-xl px-3 py-1.5 text-xs font-bold', theme.soft)}>{s}</span>)}</div>
      <p className="mt-7 text-xs text-slate-400">Registered {fmtDate(c.createdAt)}</p>
    </Sheet>
  );
}

/* -------------------------------- checkout ------------------------------- */

export function CheckoutModal() {
  const { checkoutOpen, setCheckoutOpen, cartItems, cartTotals, promo, buyer, prepareOrder, commitOrder, exportLeads, toast } = useApp();
  const navigate = useNavigate();
  const [method, setMethod] = useState('Credit Card');
  const [form, setForm] = useState({ ...buyer, card: '', cardName: '', expiry: '', cvv: '', upi: '', utr: '' });
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState('form');
  const [order, setOrder] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (checkoutOpen) {
      setStage('form'); setOrder(null); setErrors({});
      setForm((f) => ({ ...f, name: f.name || buyer.name, email: f.email || buyer.email, company: f.company || buyer.company }));
    }
  }, [checkoutOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const close = () => { if (stage !== 'processing') setCheckoutOpen(false); };

  const pay = () => {
    const errs = validateCheckout(form, method);
    setErrors(errs);
    if (Object.keys(errs).length) return toast('Please fix the highlighted fields', 'error');
    const snapshot = prepareOrder({ name: form.name.trim(), email: form.email.trim(), company: form.company.trim() }, method);
    setStage('processing');
    timer.current = setTimeout(() => { commitOrder(snapshot); setOrder(snapshot); setStage('receipt'); }, 1600);
  };

  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  if (stage === 'receipt' && order)
    return (
      <Modal open={checkoutOpen} onClose={close} title="Payment successful" maxWidth="md:max-w-xl"
        footer={order.candidateIds.length ? <div className="flex flex-col gap-2 sm:flex-row">
          <Btn variant="success" size="lg" icon={Download} className="flex-1" onClick={() => exportLeads(order.candidateIds, 'CSV', `leads-${order.id}`, [order.id])}>CSV</Btn>
          <Btn variant="outline" size="lg" icon={FileSpreadsheet} className="flex-1" onClick={() => exportLeads(order.candidateIds, 'Excel', `leads-${order.id}`, [order.id])}>Excel</Btn>
          <Btn size="lg" icon={Unlock} className="flex-1" onClick={() => { setCheckoutOpen(false); navigate('/marketplace/purchases'); }}>View data</Btn>
        </div> : <Btn size="xl" className="w-full" icon={Unlock} onClick={() => { setCheckoutOpen(false); navigate('/marketplace'); }}>Start unlocking profiles</Btn>}>
        <div className="flex flex-col items-center py-2 text-center">
          <div className="relative mb-4">
            <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-400/40" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-500/30"><CircleCheck size={42} /></div>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{order.credits && !order.candidateIds.length ? `${order.credits.toLocaleString('en-IN')} contact credits added` : `${order.candidateIds.length} profiles unlocked${order.credits ? ` · +${order.credits.toLocaleString('en-IN')} credits` : ''}`}</h3>
          <p className="mt-1 text-sm text-slate-500">{order.candidateIds.length ? 'Full names, emails and phone numbers are now visible across the marketplace.' : 'Spend one credit to unlock any profile — individually or in bulk from the catalog.'}</p>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-sm">
          <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 font-extrabold text-slate-900"><Receipt size={16} /> Receipt {order.id}</span><Badge tone="emerald">Paid</Badge></div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-slate-600">
            <dt>Date</dt><dd className="text-right">{fmtDateTime(order.date)}</dd>
            <dt>Billed to</dt><dd className="text-right">{order.buyer} · {order.company}</dd>
            <dt>Email</dt><dd className="truncate text-right">{order.email}</dd>
            <dt>Method</dt><dd className="text-right">{order.method}</dd>
          </dl>
          <ul className="my-3 space-y-1.5 border-y border-slate-200 py-3">
            {order.items.map((i, idx) => <li key={idx} className="flex justify-between gap-3"><span className="truncate text-slate-700">{i.name}</span><span className="font-bold">{fmtINR(i.price)}</span></li>)}
          </ul>
          {order.promoDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Promo {order.promoCode}</span><span>−{fmtINR2(order.promoDiscount)}</span></div>}
          <div className="mt-1 flex justify-between text-lg font-extrabold text-slate-900"><span>Total paid</span><span>{fmtINR2(order.total)}</span></div>
        </div>
      </Modal>
    );

  const methodIcons = { 'Credit Card': CreditCard, UPI: Smartphone, 'Bank Transfer': Landmark };
  return (
    <Modal open={checkoutOpen} onClose={close} locked={stage === 'processing'} title="Secure checkout" subtitle="Demo payment — no real charges are made" maxWidth="md:max-w-3xl"
      footer={<Btn size="xl" className="w-full" icon={stage === 'processing' ? undefined : Lock} disabled={stage === 'processing' || !cartItems.length} onClick={pay}>
        {stage === 'processing' ? <><Spinner /> Processing payment…</> : `Pay ${fmtINR2(cartTotals.total)}`}
      </Btn>}>
      <div className="grid gap-6 md:grid-cols-[1fr_270px]">
        <div className="space-y-6">
          <section>
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Recruiter details</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}><TextInput value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" /></Field>
              <Field label="Work email" required error={errors.email}><TextInput type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" /></Field>
              <Field label="Company" required error={errors.company} className="sm:col-span-2"><TextInput value={form.company} onChange={set('company')} error={errors.company} autoComplete="organization" /></Field>
            </div>
          </section>
          <section>
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Payment method</h4>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = methodIcons[m];
                return (
                  <button key={m} type="button" onClick={() => { setMethod(m); setErrors({}); }}
                    className={cx('flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3.5 text-xs font-bold transition', method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                    <Icon size={21} />{m}
                  </button>
                );
              })}
            </div>
            {method === 'Credit Card' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Card number" required error={errors.card} className="sm:col-span-2" hint="Demo: 4242 4242 4242 4242"><TextInput inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={form.card} onChange={(e) => setForm((f) => ({ ...f, card: fmtCard(e.target.value) }))} error={errors.card} /></Field>
                <Field label="Name on card" required error={errors.cardName} className="sm:col-span-2"><TextInput autoComplete="cc-name" value={form.cardName} onChange={set('cardName')} error={errors.cardName} /></Field>
                <Field label="Expiry" required error={errors.expiry}><TextInput inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: fmtExpiry(e.target.value) }))} error={errors.expiry} /></Field>
                <Field label="CVV" required error={errors.cvv}><TextInput inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="•••" value={form.cvv} onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, '') }))} error={errors.cvv} /></Field>
              </div>
            )}
            {method === 'UPI' && <Field label="UPI ID" required error={errors.upi} hint="Demo: recruiter@okbank"><TextInput placeholder="name@bank" value={form.upi} onChange={set('upi')} error={errors.upi} /></Field>}
            {method === 'Bank Transfer' && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-slate-600">
                    <dt>Beneficiary</dt><dd className="text-right font-bold text-slate-900">SeekerExchange Pvt Ltd</dd>
                    <dt>Account no.</dt><dd className="text-right font-mono">0000 1234 5678</dd>
                    <dt>IFSC</dt><dd className="text-right font-mono">DEMO0000123</dd>
                    <dt>Amount</dt><dd className="text-right font-bold text-slate-900">{fmtINR2(cartTotals.total)}</dd>
                  </dl>
                </div>
                <Field label="Transfer reference (UTR)" required error={errors.utr} hint="Demo: any 8+ letters/digits"><TextInput value={form.utr} onChange={set('utr')} error={errors.utr} /></Field>
              </div>
            )}
          </section>
        </div>
        <div className="order-first md:order-none">
          <div className="rounded-2xl bg-brand-soft p-4 text-sm ring-1 ring-indigo-100 md:sticky md:top-0">
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-indigo-600">Order summary</h4>
            <ul className="space-y-2">
              {cartItems.map((i) => (
                <li key={i.key} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-slate-700">{i.type === 'bundle' ? `${i.name} (${i.candidates.length})` : i.type === 'package' ? `${i.pkg.name} ×${i.qty} · ${i.credits.toLocaleString('en-IN')} credits` : i.candidate.role}</span>
                  <span className="font-bold text-slate-900">{fmtINR(i.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1.5 border-t border-indigo-100 pt-3">
              {cartTotals.promoDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Promo {promo.code}</span><span>−{fmtINR2(cartTotals.promoDiscount)}</span></div>}
              <div className="flex justify-between text-lg font-extrabold text-slate-900"><span>Total</span><span>{fmtINR2(cartTotals.total)}</span></div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-500" /> Data is licensed to verified recruiters only.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
