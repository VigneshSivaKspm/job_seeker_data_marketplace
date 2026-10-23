import React, { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Eye, EyeOff, KeyRound, LayoutDashboard, LogOut, Menu, Receipt, RotateCcw, ShieldCheck,
  SlidersHorizontal, Sparkles, Store, Users, Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { ADMIN_CREDENTIALS } from '../../lib/data.js';
import { cx } from '../../lib/utils.js';
import { Btn, ConfirmDialog, Field, Logo, Sheet, TextInput, ToastHost } from '../../components/ui.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pricing', label: 'Pricing & Roles', icon: SlidersHorizontal },
  { to: '/admin/candidates', label: 'Candidates', icon: Users, badge: true },
  { to: '/admin/orders', label: 'Orders & Sales', icon: Receipt },
];

/* --------------------------------- login --------------------------------- */

export function AdminLogin() {
  const { adminAuthed, adminLogin, toast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { state } = useLocation();

  if (adminAuthed) return <Navigate to={state?.from || '/admin'} replace />;

  const submit = (e) => {
    e.preventDefault();
    if (adminLogin(email, password)) { toast('Welcome back, Admin'); navigate(state?.from || '/admin', { replace: true }); }
    else setError('Incorrect email or password.');
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-dots opacity-60" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="relative"><Logo dark /></div>
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-indigo-200 ring-1 ring-white/20"><ShieldCheck size={13} /> Super Admin Console</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">Run the marketplace with <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">total clarity</span></h1>
          <ul className="mt-8 space-y-4 text-slate-300">
            {[[BadgeCheck, 'Verify candidate profiles before they go live'], [SlidersHorizontal, 'Tune pricing by seniority and industry rarity'], [Receipt, 'Track every order, buyer and dataset download']].map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><Icon size={17} className="text-indigo-300" /></span>{t}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} SeekerExchange</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowLeft size={15} /> Back to site</Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin sign in</h2>
          <p className="mt-1.5 text-slate-500">Enter your credentials to access the console.</p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <Field label="Email" required><TextInput type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="admin@seekerexchange.com" /></Field>
            <Field label="Password" required>
              <div className="relative">
                <TextInput type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" className="pr-12" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </Field>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}
            <Btn type="submit" size="xl" className="w-full" icon={KeyRound}>Sign in</Btn>
          </form>

          <div className="mt-8 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-xs text-slate-600">
                <div className="mb-1 flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-indigo-600"><Sparkles size={12} /> Demo credentials</div>
                <div className="truncate font-mono">{ADMIN_CREDENTIALS.email}</div>
                <div className="font-mono">{ADMIN_CREDENTIALS.password}</div>
              </div>
              <Btn size="sm" variant="soft" icon={Wand2} onClick={() => { setEmail(ADMIN_CREDENTIALS.email); setPassword(ADMIN_CREDENTIALS.password); setError(''); }}>Autofill</Btn>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">This sign-in is a front-end demo gate. Connect real authentication and a backend API before handling live data.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- shell -------------------------------- */

function NavItems({ onNavigate }) {
  const { candidates } = useApp();
  const pending = candidates.filter((c) => c.status === 'Pending Verification').length;
  return (
    <nav className="space-y-1">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
          className={({ isActive }) => cx('group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition', isActive ? 'bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/80 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
          <n.icon size={18} /><span className="flex-1">{n.label}</span>
          {n.badge && pending > 0 && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-900">{pending}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }) {
  const { adminLogout } = useApp();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6"><Logo dark to="/admin" /></div>
      <div className="px-4"><div className="mb-2 px-3.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-slate-500">Console</div><NavItems onNavigate={onNavigate} /></div>
      <div className="mt-auto space-y-2 p-4">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"><Store size={18} /> View storefront</Link>
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">SA</span>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-white">Super Admin</div><div className="truncate text-[11px] text-slate-400">{ADMIN_CREDENTIALS.email}</div></div>
          <button onClick={() => { adminLogout(); navigate('/admin/login'); }} aria-label="Sign out" className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"><LogOut size={16} /></button>
        </div>
      </div>
    </div>
  );
}

const TITLES = { '/admin': 'Dashboard', '/admin/pricing': 'Pricing & Roles', '/admin/candidates': 'Candidates', '/admin/orders': 'Orders & Sales' };

export default function AdminLayout() {
  const { adminAuthed, resetDemo, candidates } = useApp();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  if (!adminAuthed) return <Navigate to="/admin/login" state={{ from: pathname }} replace />;
  const pending = candidates.filter((c) => c.status === 'Pending Verification').length;

  return (
    <div className="min-h-screen bg-slate-100/80">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-hidden bg-slate-950 lg:block">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="relative h-full"><SidebarBody /></div>
      </aside>

      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 px-4 md:px-8">
          <button onClick={() => setMenu(true)} aria-label="Open menu" className="rounded-full p-2 text-slate-700 hover:bg-slate-200/60 lg:hidden"><Menu size={22} /></button>
          <div className="lg:hidden"><Logo compact to="/admin" /></div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Admin</div>
            <h1 className="-mt-0.5 text-lg font-extrabold tracking-tight text-slate-900">{TITLES[pathname] || 'Console'}</h1>
          </div>
          <div className="flex-1" />
          <Btn size="sm" variant="outline" icon={RotateCcw} onClick={() => setConfirmReset(true)} className="hidden sm:inline-flex">Reset demo data</Btn>
          <Btn as={Link} to="/" size="sm" variant="dark" icon={Store} className="hidden sm:inline-flex">Storefront</Btn>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-6 md:px-8 lg:pb-12"><Outlet /></main>
      </div>

      {/* mobile tab bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden" aria-label="Admin">
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="flex flex-col items-center gap-0.5 pb-2 pt-1">
              {({ isActive }) => (
                <>
                  <span className={cx('relative flex h-8 w-14 items-center justify-center rounded-full transition', isActive ? 'bg-brand text-white shadow-md shadow-indigo-500/30' : 'text-slate-500')}>
                    <n.icon size={19} />
                    {n.badge && pending > 0 && <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-900">{pending}</span>}
                  </span>
                  <span className={cx('text-[10.5px] font-bold', isActive ? 'text-indigo-700' : 'text-slate-500')}>{n.label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Admin menu" width="md:w-[320px]" side="left">
        <div className="-mx-6 -my-1 overflow-hidden rounded-2xl bg-slate-950">
          <SidebarBody onNavigate={() => setMenu(false)} />
        </div>
        <Btn variant="outline" size="md" icon={RotateCcw} className="mt-4 w-full" onClick={() => { setMenu(false); setConfirmReset(true); }}>Reset demo data</Btn>
      </Sheet>

      <ConfirmDialog open={confirmReset} title="Reset demo data?" confirmLabel="Reset"
        message="All candidates, orders, pricing and categories return to their original demo values. Your cart and purchases are cleared too."
        onCancel={() => setConfirmReset(false)} onConfirm={() => { resetDemo(); setConfirmReset(false); }} />
      <ToastHost />
    </div>
  );
}
