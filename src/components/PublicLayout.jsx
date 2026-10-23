import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BadgeCheck, ChevronRight, Home, Lock, Mail, Menu, ShieldCheck, ShoppingBag, Sparkles, Store, UserPlus, Unlock, Settings2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { cx, fmtINR } from '../lib/utils.js';
import { Badge, Btn, Logo, Sheet, ToastHost } from './ui.jsx';
import { CartSheet, CheckoutModal, PreviewSheet } from './market.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/join', label: 'For job seekers' },
  { to: '/marketplace', label: 'For recruiters' },
];

function CartButton({ dark }) {
  const { setCartOpen, cartItems, cartTotals } = useApp();
  return (
    <button
      onClick={() => setCartOpen(true)} aria-label="Open cart"
      className={cx('relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition',
        dark ? 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50')}
    >
      <ShoppingBag size={17} />
      <span className="hidden lg:inline">{cartItems.length ? fmtINR(cartTotals.total) : 'Cart'}</span>
      {cartItems.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 px-1 text-[11px] font-extrabold text-white shadow">{cartItems.length}</span>}
    </button>
  );
}

function Navbar() {
  const { setMenuOpen } = useApp();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={cx('sticky top-0 z-40 transition-all', scrolled ? 'glass border-b border-slate-200/70 shadow-soft' : 'border-b border-transparent bg-transparent')}>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4 md:px-6">
        <Logo />
        <nav className="ml-8 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => cx('rounded-full px-4 py-2 text-sm font-bold transition', isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 xl:flex"><BadgeCheck size={14} /> Verified recruiters only</div>
        <CartButton />
        {pathname !== '/join' && <Btn as={Link} to="/join" size="md" icon={Sparkles} className="hidden sm:inline-flex">Create free profile</Btn>}
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-full p-2.5 text-slate-700 hover:bg-slate-100 md:hidden"><Menu size={22} /></button>
      </div>
    </header>
  );
}

function BottomNav() {
  const { setCartOpen, cartItems } = useApp();
  const { pathname } = useLocation();
  const is = (p) => (p === '/' ? pathname === '/' : pathname.startsWith(p));
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl md:hidden" aria-label="Primary">
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1.5">
        {[
          { to: '/', label: 'Home', icon: Home },
          { to: '/join', label: 'Join', icon: UserPlus },
          { to: '/marketplace', label: 'Market', icon: Store },
        ].map((i) => (
          <Link key={i.to} to={i.to} className="flex flex-col items-center gap-0.5 pb-2 pt-1">
            <span className={cx('flex h-8 w-16 items-center justify-center rounded-full transition-all', is(i.to) ? 'bg-brand text-white shadow-md shadow-indigo-500/30' : 'text-slate-500')}><i.icon size={20} /></span>
            <span className={cx('text-[11px] font-bold', is(i.to) ? 'text-indigo-700' : 'text-slate-500')}>{i.label}</span>
          </Link>
        ))}
        <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-0.5 pb-2 pt-1">
          <span className="relative flex h-8 w-16 items-center justify-center rounded-full text-slate-500">
            <ShoppingBag size={20} />
            {cartItems.length > 0 && <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-extrabold text-white">{cartItems.length}</span>}
          </span>
          <span className="text-[11px] font-bold text-slate-500">Cart</span>
        </button>
      </div>
    </nav>
  );
}

function MenuSheet() {
  const { menuOpen, setMenuOpen, purchasedIds } = useApp();
  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/join', label: 'Create your profile', icon: UserPlus, hot: true },
    { to: '/marketplace', label: 'Browse talent data', icon: Store },
    { to: '/marketplace/bundles', label: 'Dataset bundles', icon: ShoppingBag },
    { to: '/marketplace/purchases', label: 'My purchases', icon: Unlock, count: purchasedIds.length },
    { to: '/admin', label: 'Admin console', icon: Settings2 },
  ];
  return (
    <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" width="md:w-[360px]">
      <div className="space-y-2">
        {items.map((n) => (
          <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)}
            className={cx('flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold', n.hot ? 'bg-brand text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-50 text-slate-700')}>
            <n.icon size={19} /><span className="flex-1">{n.label}</span>
            {n.count > 0 && <Badge tone="emerald">{n.count}</Badge>}
            <ChevronRight size={16} className="opacity-60" />
          </Link>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-300">
        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white"><Lock size={14} /> Privacy first</div>
        Contact details are masked until purchase and sold only to verified recruiters.
      </div>
    </Sheet>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-400">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-6">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">The privacy-first marketplace connecting job seekers with verified recruiters. Candidates stay in control of their data.</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400"><ShieldCheck size={15} /> Contact details masked by default</div>
        </div>
        {[
          ['Job seekers', [['Create profile', '/join'], ['How it works', '/#how'], ['Privacy promise', '/#privacy'], ['FAQ', '/#faq']]],
          ['Recruiters', [['Browse talent', '/marketplace'], ['Dataset bundles', '/marketplace/bundles'], ['My purchases', '/marketplace/purchases']]],
          ['Company', [['Admin console', '/admin'], ['Contact', 'mailto:hello@seekerexchange.example']]],
        ].map(([h, ls]) => (
          <div key={h}>
            <h4 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-200">{h}</h4>
            <ul className="space-y-2.5 text-sm">
              {ls.map(([t, to]) => (
                <li key={t}>{to.startsWith('mailto') || to.startsWith('/#') ? <a href={to} className="inline-flex items-center gap-1.5 hover:text-white">{to.startsWith('mailto') && <Mail size={13} />}{t}</a> : <Link to={to} className="hover:text-white">{t}</Link>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative border-t border-white/10 px-4 py-5 text-center text-xs md:px-6">© {new Date().getFullYear()} SeekerExchange. Demo application — all candidate data is fictional.</div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  const focus = pathname === '/join';
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      {!focus && <div className="h-20 bg-slate-950 md:hidden" aria-hidden />}
      {!focus && <BottomNav />}
      <MenuSheet />
      <CartSheet />
      <PreviewSheet />
      <CheckoutModal />
      <ToastHost />
    </div>
  );
}
