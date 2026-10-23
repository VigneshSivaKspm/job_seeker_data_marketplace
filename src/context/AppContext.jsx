import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ADMIN_CREDENTIALS, BUNDLES, INITIAL_CATEGORIES, INITIAL_PACKAGES, INITIAL_PRICING, INITIAL_WALLET, PROMOS,
  SEED_CANDIDATES, THEME_KEYS,
} from '../lib/data.js';
import {
  buildCsv, buildExcelHtml, buildSeedOrders, computePrice, downloadFile, matchesBundle, round2, slugify,
} from '../lib/utils.js';

/* ------------------------------ APP CONTEXT ----------------------------- */

const STORE_PREFIX = 'sx:v3:';

/** useState that mirrors to localStorage and syncs across browser tabs (e.g. /join in one tab, /admin in another). */
function usePersisted(key, initial, storage = 'local') {
  const full = STORE_PREFIX + key;
  const area = () => (storage === 'session' ? window.sessionStorage : window.localStorage);
  const [value, setValue] = useState(() => {
    try {
      const raw = area().getItem(full);
      if (raw) return JSON.parse(raw);
    } catch { /* storage unavailable or corrupt: fall back to seed */ }
    return typeof initial === 'function' ? initial() : initial;
  });
  useEffect(() => {
    try { area().setItem(full, JSON.stringify(value)); } catch { /* quota / private mode */ }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (storage !== 'local') return undefined;
    const onStorage = (e) => {
      if (e.key !== full || !e.newValue) return;
      try { setValue(JSON.parse(e.newValue)); } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [full, storage]);
  return [value, setValue];
}

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [categories, setCategories] = usePersisted('categories', INITIAL_CATEGORIES);
  const [pricing, setPricing] = usePersisted('pricing', INITIAL_PRICING);
  const [packages, setPackages] = usePersisted('packages', INITIAL_PACKAGES);
  const [candidates, setCandidates] = usePersisted('candidates', SEED_CANDIDATES);
  const [orders, setOrders] = usePersisted('orders', () => buildSeedOrders(SEED_CANDIDATES, INITIAL_CATEGORIES, INITIAL_PRICING));
  const [cart, setCart] = usePersisted('cart', []);
  const [promo, setPromo] = usePersisted('promo', null);
  const [purchasedIds, setPurchasedIds] = usePersisted('purchased', []);
  const [wallet, setWallet] = usePersisted('wallet', INITIAL_WALLET);
  const [buyer, setBuyer] = usePersisted('buyer', { name: '', email: '', company: '' });
  const [adminAuthed, setAdminAuthed] = usePersisted('admin', false, 'session');
  const [toasts, setToasts] = useState([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const toast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  /* ---- admin session (client-side demo gate — replace with real auth + API before production) ---- */
  const adminLogin = (email, password) => {
    const ok = email.trim().toLowerCase() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
    if (ok) setAdminAuthed(true);
    return ok;
  };
  const adminLogout = () => setAdminAuthed(false);

  const resetDemo = () => {
    setCategories(INITIAL_CATEGORIES);
    setPricing(INITIAL_PRICING);
    setPackages(INITIAL_PACKAGES);
    setCandidates(SEED_CANDIDATES);
    setOrders(buildSeedOrders(SEED_CANDIDATES, INITIAL_CATEGORIES, INITIAL_PRICING));
    setCart([]); setPromo(null); setPurchasedIds([]); setWallet(INITIAL_WALLET); setBuyer({ name: '', email: '', company: '' });
    toast('Demo data restored');
  };

  /* ---- derived pricing & lookups ---- */
  const priceOf = useCallback((c) => computePrice(c, categories, pricing), [categories, pricing]);
  const purchasedSet = useMemo(() => new Set(purchasedIds), [purchasedIds]);
  const isUnlocked = (id) => purchasedSet.has(id);
  const rolesFor = (industryName) => categories.find((c) => c.name === industryName)?.roles || [];
  const getCandidate = (id) => candidates.find((c) => c.id === id);

  /** Average single-profile price across the live catalogue — used to show bulk savings. */
  const avgSinglePrice = useMemo(() => {
    const live = candidates.filter((c) => c.status === 'Active');
    return live.length ? live.reduce((s, c) => s + priceOf(c), 0) / live.length : 0;
  }, [candidates, priceOf]);

  /* ---- bundles ---- */
  const resolveBundle = (b) =>
    candidates.filter((c) => c.status === 'Active' && !purchasedSet.has(c.id) && matchesBundle(c, b, categories));

  /* ---- cart (prices are derived live so admin edits reflect immediately) ---- */
  const cartItems = useMemo(() => {
    const out = [];
    cart.forEach((item) => {
      if (item.type === 'lead') {
        const c = candidates.find((x) => x.id === item.candidateId);
        if (c && c.status === 'Active') out.push({ ...item, candidate: c, candidates: [c], gross: priceOf(c), price: priceOf(c) });
      } else if (item.type === 'package') {
        const pkg = packages.find((p) => p.id === item.packageId);
        if (pkg) out.push({ ...item, pkg, candidates: [], credits: pkg.contacts * item.qty, gross: pkg.price * item.qty, price: pkg.price * item.qty });
      } else {
        const cs = item.candidateIds.map((id) => candidates.find((x) => x.id === id)).filter((c) => c && c.status === 'Active');
        if (cs.length) {
          const gross = cs.reduce((s, c) => s + priceOf(c), 0);
          out.push({ ...item, candidates: cs, gross, price: round2((gross * (100 - item.discount)) / 100) });
        }
      }
    });
    return out;
  }, [cart, candidates, packages, priceOf]);

  const cartTotals = useMemo(() => {
    const gross = cartItems.reduce((s, i) => s + i.gross, 0);
    const subtotal = round2(cartItems.reduce((s, i) => s + i.price, 0));
    const promoDiscount = promo && subtotal >= promo.min ? round2((subtotal * promo.pct) / 100) : 0;
    const ids = new Set(cartItems.flatMap((i) => i.candidates.map((c) => c.id)));
    const credits = cartItems.reduce((s, i) => s + (i.credits || 0), 0);
    return { gross: round2(gross), subtotal, bundleSavings: round2(gross - subtotal), promoDiscount, total: round2(subtotal - promoDiscount), leadCount: ids.size, credits };
  }, [cartItems, promo]);

  const coveredByBundle = useMemo(
    () => new Set(cartItems.filter((i) => i.type === 'bundle').flatMap((i) => i.candidates.map((c) => c.id))),
    [cartItems]
  );
  const inCart = (id) => cartItems.some((i) => i.type === 'lead' && i.candidateId === id) || coveredByBundle.has(id);

  const addLead = (id) => {
    const c = getCandidate(id);
    if (!c || c.status !== 'Active') return toast('This profile is not available for purchase', 'error');
    if (purchasedSet.has(id)) return toast('You already own this profile', 'error');
    if (coveredByBundle.has(id)) return toast('Already included in a bundle in your cart', 'error');
    if (cart.some((i) => i.type === 'lead' && i.candidateId === id)) return;
    setCart((x) => [...x, { key: `lead:${id}`, type: 'lead', candidateId: id }]);
    toast(`${c.role} added to cart`);
  };

  const addBundle = (bundleId) => {
    const b = BUNDLES.find((x) => x.id === bundleId);
    const ids = resolveBundle(b).map((c) => c.id);
    if (!ids.length) return toast('No new profiles available in this bundle', 'error');
    setCart((x) => [
      ...x.filter((i) => i.key !== `bundle:${bundleId}` && !(i.type === 'lead' && ids.includes(i.candidateId))),
      { key: `bundle:${bundleId}`, type: 'bundle', bundleId, name: b.name, discount: b.discount, candidateIds: ids },
    ]);
    toast(`Bundle added · ${ids.length} profiles`);
  };

  /** Add a bulk contact package (or one more of it) to the cart. */
  const addPackageToCart = (packageId) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;
    setCart((x) => {
      const key = `pkg:${packageId}`;
      return x.some((i) => i.key === key)
        ? x.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + 1, 20) } : i))
        : [...x, { key, type: 'package', packageId, qty: 1 }];
    });
    toast(`${pkg.name} · ${pkg.contacts.toLocaleString('en-IN')} contacts added to cart`);
  };
  const setPackageQty = (key, qty) =>
    setCart((x) => (qty < 1 ? x.filter((i) => i.key !== key) : x.map((i) => (i.key === key ? { ...i, qty: Math.min(qty, 20) } : i))));

  const removeFromCart = (key) => setCart((x) => x.filter((i) => i.key !== key));

  const applyPromo = (raw) => {
    const code = raw.trim().toUpperCase();
    if (!PROMOS[code]) return toast('Invalid promo code', 'error');
    setPromo({ code, ...PROMOS[code] });
    toast(`${code} applied · ${PROMOS[code].label}`);
  };

  /* ---- checkout ---- */
  const prepareOrder = (buyerInfo, method) => {
    const lines = [];
    const items = cartItems.map((i) => {
      const factor = i.gross ? i.price / i.gross : 1;
      i.candidates.forEach((c) => lines.push({ candidateId: c.id, industry: c.industry, role: c.role, price: round2(priceOf(c) * factor) }));
      if (i.type === 'lead') return { type: 'lead', name: `${i.candidate.role} · ${i.candidate.id}`, count: 1, price: i.price };
      if (i.type === 'package')
        return { type: 'package', name: `${i.pkg.name} ×${i.qty} · ${i.credits.toLocaleString('en-IN')} contact credits`, count: i.credits, price: i.price, credits: i.credits };
      return { type: 'bundle', name: i.name, count: i.candidates.length, price: i.price, gross: i.gross, discount: i.discount };
    });
    const { subtotal, bundleSavings, promoDiscount, total } = cartTotals;
    const factor = subtotal ? total / subtotal : 1;
    const credits = cartItems.reduce((s, i) => s + (i.credits || 0), 0);
    const creditSpend = round2(cartItems.filter((i) => i.type === 'package').reduce((s, i) => s + i.price, 0) * factor);
    return {
      id: `ORD-${5000 + orders.length + 1}`,
      date: new Date().toISOString(),
      buyer: buyerInfo.name, email: buyerInfo.email, company: buyerInfo.company, method,
      kind: credits && !lines.length ? 'package' : 'purchase',
      items,
      lines: lines.map((l) => ({ ...l, paid: round2(l.price * factor) })),
      candidateIds: [...new Set(lines.map((l) => l.candidateId))],
      credits, creditSpend,
      subtotal, bundleSavings, promoCode: promoDiscount ? promo.code : null, promoDiscount, total,
      downloads: [], mine: true,
    };
  };

  const commitOrder = (order) => {
    setOrders((o) => [order, ...o]);
    setPurchasedIds((p) => [...new Set([...p, ...order.candidateIds])]);
    if (order.credits) setWallet((w) => ({ credits: w.credits + order.credits, bought: w.bought + order.credits, spent: round2(w.spent + order.creditSpend) }));
    setBuyer({ name: order.buyer, email: order.email, company: order.company });
    setCart([]);
    setPromo(null);
  };

  /** Spend 1 contact credit per profile. Returns the redemption record, or null if it could not be done. */
  const unlockWithCredits = (ids) => {
    const targets = [...new Set(ids)].map(getCandidate).filter((c) => c && c.status === 'Active' && !purchasedSet.has(c.id));
    if (!targets.length) { toast('Nothing to unlock', 'error'); return null; }
    if (wallet.credits < targets.length) { toast(`You need ${targets.length} credits but have ${wallet.credits}`, 'error'); return null; }
    const rate = wallet.bought ? round2(wallet.spent / wallet.bought) : 0;
    const n = targets.length;
    const record = {
      id: `ORD-${5000 + orders.length + 1}`,
      date: new Date().toISOString(),
      buyer: buyer.name || 'Recruiter', email: buyer.email, company: buyer.company, method: 'Credits', kind: 'redeem',
      items: [{ type: 'credits', name: `Unlocked ${n} profile${n > 1 ? 's' : ''} with credits`, count: n, price: 0 }],
      lines: targets.map((c) => ({ candidateId: c.id, industry: c.industry, role: c.role, price: rate, paid: rate })),
      candidateIds: targets.map((c) => c.id), credits: 0, creditsUsed: n, creditSpend: 0,
      subtotal: 0, bundleSavings: 0, promoCode: null, promoDiscount: 0, total: 0, downloads: [], mine: true,
    };
    setOrders((o) => [record, ...o]);
    setWallet((w) => ({ ...w, credits: w.credits - n }));
    setPurchasedIds((p) => [...new Set([...p, ...record.candidateIds])]);
    toast(`${n} profile${n > 1 ? 's' : ''} unlocked · ${n} credit${n > 1 ? 's' : ''} used`);
    return record;
  };

  const exportLeads = (ids, format, baseName, orderIds = []) => {
    const rows = ids.map(getCandidate).filter(Boolean);
    if (!rows.length) return toast('Nothing to export', 'error');
    if (format === 'CSV') downloadFile(`${baseName}.csv`, 'text/csv;charset=utf-8', buildCsv(rows));
    else downloadFile(`${baseName}.xls`, 'application/vnd.ms-excel', buildExcelHtml(rows));
    if (orderIds.length)
      setOrders((os) => os.map((o) => (orderIds.includes(o.id) ? { ...o, downloads: [...o.downloads, { at: new Date().toISOString(), format }] } : o)));
    toast(`${rows.length} profile${rows.length > 1 ? 's' : ''} exported as ${format}`);
  };

  /* ---- candidates ---- */
  const addCandidate = (data) => {
    const next = Math.max(1000, ...candidates.map((c) => Number(c.id.split('-')[1]))) + 1;
    const c = { ...data, id: `CND-${next}`, status: 'Pending Verification', createdAt: new Date().toISOString() };
    setCandidates((x) => [c, ...x]);
    return c;
  };
  const updateCandidate = (id, patch) => setCandidates((x) => x.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const deleteCandidate = (id) => {
    setCandidates((x) => x.filter((c) => c.id !== id));
    setCart((x) => x.filter((i) => !(i.type === 'lead' && i.candidateId === id)));
  };

  /* ---- categories / pricing (admin) ---- */
  const setBasePrice = (level, value) => setPricing((p) => ({ ...p, base: { ...p.base, [level]: value } }));
  const setCategoryColor = (id, color) => setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, color } : c)));
  const setRarity = (id, rarity) => setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, rarity } : c)));
  const renameCategory = (id, name) => {
    const clean = name.trim();
    const cat = categories.find((c) => c.id === id);
    if (!clean || clean === cat.name) return false;
    if (categories.some((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase())) {
      toast('A category with that name already exists', 'error');
      return false;
    }
    setCandidates((cs) => cs.map((c) => (c.industry === cat.name ? { ...c, industry: clean } : c)));
    setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, name: clean } : c)));
    return true;
  };
  const addCategory = (name, rarity) => {
    const clean = name.trim();
    if (!clean) return toast('Enter a category name', 'error');
    if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) return toast('Category already exists', 'error');
    let id = slugify(clean);
    if (categories.some((c) => c.id === id)) id = `${id}-${Date.now()}`;
    setCategories((cs) => [...cs, { id, color: THEME_KEYS[cs.length % THEME_KEYS.length], name: clean, rarity, roles: [] }]);
    toast(`Category "${clean}" created`);
  };
  const deleteCategory = (id) => {
    const cat = categories.find((c) => c.id === id);
    if (candidates.some((c) => c.industry === cat.name)) return toast('Reassign or delete its candidates first', 'error');
    setCategories((cs) => cs.filter((c) => c.id !== id));
    toast(`Category "${cat.name}" removed`);
  };
  const addRole = (id, role) => {
    const clean = role.trim();
    const cat = categories.find((c) => c.id === id);
    if (!clean) return;
    if (cat.roles.some((r) => r.toLowerCase() === clean.toLowerCase())) return toast('Role already exists', 'error');
    setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, roles: [...c.roles, clean] } : c)));
  };
  const deleteRole = (id, role) => {
    const cat = categories.find((c) => c.id === id);
    if (candidates.some((c) => c.industry === cat.name && c.role === role)) return toast('Role is used by existing candidates', 'error');
    setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, roles: c.roles.filter((r) => r !== role) } : c)));
  };

  /* ---- bulk packages (admin) ---- */
  const savePackage = (id, patch) => setPackages((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const setPopularPackage = (id) => setPackages((ps) => ps.map((p) => ({ ...p, popular: p.id === id ? !p.popular : false })));
  const createPackage = ({ name, contacts, price }) => {
    const clean = name.trim();
    if (!clean) return toast('Enter a package name', 'error');
    if (!(contacts > 0) || !(price > 0)) return toast('Contacts and price must be greater than zero', 'error');
    setPackages((ps) => [...ps, { id: `pk-${Date.now()}`, name: clean, contacts: Math.round(contacts), price, popular: false, tagline: `${Math.round(contacts).toLocaleString('en-IN')} contact credits` }]);
    toast(`Package "${clean}" created`);
  };
  const removePackage = (id) => {
    setPackages((ps) => ps.filter((p) => p.id !== id));
    setCart((x) => x.filter((i) => i.packageId !== id));
  };

  const value = {
    categories, pricing, packages, candidates, orders, cart, promo, purchasedIds, wallet, buyer, toasts, adminAuthed,
    cartOpen, menuOpen, previewId, checkoutOpen,
    setCartOpen, setMenuOpen, setPreviewId, setCheckoutOpen, setPromo, toast, adminLogin, adminLogout, resetDemo,
    priceOf, avgSinglePrice, isUnlocked, rolesFor, getCandidate, resolveBundle,
    cartItems, cartTotals, inCart, addLead, addBundle, addPackageToCart, setPackageQty, removeFromCart, applyPromo,
    prepareOrder, commitOrder, unlockWithCredits, exportLeads,
    addCandidate, updateCandidate, deleteCandidate,
    setBasePrice, setRarity, setCategoryColor, renameCategory, addCategory, deleteCategory, addRole, deleteRole,
    savePackage, setPopularPackage, createPackage, removePackage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
