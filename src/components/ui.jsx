import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle, Briefcase, Code2, CircleCheck, Factory, HeartPulse, Landmark, Loader2, Store, Truck, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { THEMES } from '../lib/data.js';
import { cx, initials } from '../lib/utils.js';

/* ------------------------------- buttons -------------------------------- */

const VARIANTS = {
  primary: 'bg-brand text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:-translate-y-px active:translate-y-0',
  dark: 'bg-slate-900 text-white shadow-md hover:bg-slate-800',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-px',
  outline: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300',
  soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
  white: 'bg-white text-indigo-700 shadow-lg shadow-black/10 hover:bg-indigo-50 hover:-translate-y-px',
  glass: 'bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur hover:bg-white/25',
};
const SIZES = {
  sm: 'h-8 px-3.5 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  xl: 'h-14 px-8 text-base',
};

export function Btn({ as: Tag = 'button', variant = 'primary', size = 'md', icon: Icon, iconRight: IconR, className, children, ...props }) {
  const extra = Tag === 'button' ? { type: 'button' } : {};
  return (
    <Tag
      {...extra}
      {...props}
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant], SIZES[size], className
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 17} />}
      {children}
      {IconR && <IconR size={size === 'sm' ? 14 : 17} />}
    </Tag>
  );
}

/* -------------------------------- badges -------------------------------- */

const TONES = {
  slate: 'bg-slate-100 text-slate-600',
  indigo: 'bg-indigo-50 text-indigo-700',
  violet: 'bg-violet-50 text-violet-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-700',
  dark: 'bg-slate-900 text-white',
};
export function Badge({ tone = 'slate', icon: Icon, className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold', TONES[tone], className)}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}
const STATUS_TONE = { Active: 'emerald', 'Pending Verification': 'amber', 'Sold Out': 'slate' };
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status]}>{status}</Badge>;

/* ---------------------------- industry visuals --------------------------- */

const ICONS = { it: Code2, health: HeartPulse, fin: Landmark, retail: Store, logi: Truck, mfg: Factory };
export const iconFor = (id) => ICONS[id] || Briefcase;

/** Gradient tile with the industry's icon. */
export function IndustryTile({ cat, size = 'h-11 w-11', iconSize = 20, className }) {
  const Icon = iconFor(cat?.id);
  const t = THEMES[cat?.color] || THEMES.indigo;
  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', t.grad, size, className)}>
      <Icon size={iconSize} />
    </div>
  );
}

export function Avatar({ name, unlocked, size = 'h-11 w-11', grad = 'from-indigo-500 to-violet-500', className }) {
  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-extrabold text-white shadow-sm', unlocked ? 'from-emerald-500 to-teal-500' : grad, size, className)}>
      {initials(name)}
    </div>
  );
}

/* --------------------------------- logo --------------------------------- */

export function Logo({ compact, dark, to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="SeekerExchange home">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand shadow-lg shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={cx('block text-[17px] font-extrabold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>Seeker<span className={dark ? 'text-indigo-300' : 'text-gradient'}>Exchange</span></span>
          <span className={cx('mt-1 block text-[9.5px] font-bold uppercase tracking-[.18em]', dark ? 'text-slate-400' : 'text-slate-400')}>Talent data, protected</span>
        </span>
      )}
    </Link>
  );
}

/* ------------------------------- animations ------------------------------ */

export function Reveal({ children, delay = 0, className, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setShown(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} style={{ animationDelay: `${delay}ms` }} className={cx(shown ? 'animate-fade-up' : 'opacity-0', className)}>{children}</Tag>;
}

/* ---------------------------- overlays & dialogs ------------------------- */

function useLockBody(active) {
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}
function useEscape(active, fn) {
  useEffect(() => {
    if (!active) return undefined;
    const h = (e) => e.key === 'Escape' && fn();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, fn]);
}

/** Bottom sheet on phones, right-hand drawer from tablet up. */
export function Sheet({ open, onClose, title, subtitle, children, footer, width = 'md:w-[460px]', side = 'right' }) {
  useLockBody(open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={cx(
          'absolute inset-x-0 bottom-0 flex max-h-[92vh] animate-sheet-up flex-col rounded-t-[28px] bg-white shadow-2xl',
          side === 'right'
            ? 'md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:animate-slide-in md:rounded-none md:rounded-l-[28px]'
            : 'md:inset-y-0 md:left-0 md:right-auto md:max-h-none md:rounded-none md:rounded-r-[28px]',
          width
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 md:hidden" />
        <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-4 md:pt-6">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-5 pt-1">{children}</div>
        {footer && <div className="pb-safe border-t border-slate-100 bg-white px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Full-height sheet on phones, centred dialog from tablet up. */
export function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 'md:max-w-2xl', locked = false }) {
  useLockBody(open);
  useEscape(open && !locked, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm" onClick={locked ? undefined : onClose} />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={cx('relative flex max-h-[94vh] w-full animate-sheet-up flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl md:animate-pop-in md:rounded-3xl', maxWidth)}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {!locked && <button onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"><X size={18} /></button>}
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
        {footer && <div className="pb-safe border-t border-slate-100 bg-slate-50/80 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', tone = 'danger', onConfirm, onCancel }) {
  return (
    <Modal
      open={open} onClose={onCancel} title={title} maxWidth="md:max-w-md"
      footer={<div className="flex justify-end gap-2"><Btn variant="outline" onClick={onCancel}>Cancel</Btn><Btn variant={tone === 'primary' ? 'primary' : 'dark'} className={tone === 'primary' ? '' : '!bg-rose-600 hover:!bg-rose-700'} onClick={onConfirm}>{confirmLabel}</Btn></div>}
    >
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
    </Modal>
  );
}

export function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      {toasts.map((t) => (
        <div key={t.id} className={cx('pointer-events-auto flex max-w-sm animate-pop-in items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl', t.type === 'error' ? 'bg-rose-600' : 'bg-slate-900')}>
          {t.type === 'error' ? <AlertCircle size={17} /> : <CircleCheck size={17} className="text-emerald-400" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- forms -------------------------------- */

export const inputCls =
  'w-full h-12 rounded-xl border bg-white px-4 text-base md:text-[15px] font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 transition focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400';

export function Field({ label, error, hint, required, as: Tag = 'label', className, children }) {
  return (
    <Tag className={cx('block', className)}>
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-bold text-slate-700">
        {label}{required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600"><AlertCircle size={13} />{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
      ) : null}
    </Tag>
  );
}

export const TextInput = ({ error, className, ...p }) => <input {...p} className={cx(inputCls, error ? 'border-rose-400' : 'border-slate-200', className)} />;

export const SelectInput = ({ error, className, children, ...p }) => (
  <select {...p} className={cx(inputCls, 'appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272.5%27><path d=%27m6 9 6 6 6-6%27/></svg>")] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10', error ? 'border-rose-400' : 'border-slate-200', className)}>
    {children}
  </select>
);

export function PillGroup({ options, value, onChange, small }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o} type="button" onClick={() => onChange(o)}
          className={cx('rounded-full font-bold transition-all', small ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-sm',
            value === o ? 'bg-brand text-white shadow-md shadow-indigo-500/25' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:ring-indigo-300')}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Numeric input that tolerates an empty field while typing. */
export function NumberField({ value, onCommit, min = 0, step = 1, prefix, className }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <div className={cx('relative', className)}>
      {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">{prefix}</span>}
      <input
        type="number" inputMode="decimal" min={min} step={step} value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== '' && Number.isFinite(n) && n >= min) onCommit(n);
        }}
        onBlur={() => setText(String(value))}
        className={cx(inputCls, 'border-slate-200', prefix && 'pl-8')}
      />
    </div>
  );
}

/* --------------------------------- misc --------------------------------- */

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-indigo-500"><Icon size={28} /></div>
      <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const Spinner = ({ size = 18 }) => <Loader2 size={size} className="animate-spin" />;

export function Card({ title, subtitle, action, children, className, bodyClass = 'p-5 md:p-6' }) {
  return (
    <section className={cx('rounded-3xl border border-slate-200/80 bg-white shadow-soft', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 md:px-6">
          <div><h3 className="font-extrabold tracking-tight text-slate-900">{title}</h3>{subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}</div>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon size={14} /></span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="truncate text-[13px] font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

/** Scrolls to top on route change. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}
