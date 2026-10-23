import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ADMIN_CREDENTIALS, BUNDLES, INITIAL_CATEGORIES, INITIAL_PRICING, PROMOS, SEED_CANDIDATES, THEME_KEYS,
} from '../lib/data.js';
import {
  buildCsv, buildExcelHtml, buildSeedOrders, computePrice, downloadFile, matchesBundle, round2, slugify,
} from '../lib/utils.js';

/* ------------------------------ APP CONTEXT ----------------------------- */

const STORE_PREFIX = 'sx:v2:';

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
  const [candidates, setCandidates] = usePersisted('candidates', SEED_CANDIDATES);
  const [orders, setOrders] = usePersisted('orders', () => buildSeedOrders(SEED_CANDIDATES, INITIAL_CATEGORIES, INITIAL_PRICING));
  const [cart, setCart] = usePersisted('cart', []);
  const [promo, setPromo] = usePersisted('promo', null);
  const [purchasedIds, setPurchasedIds] = usePersisted('purchased', []);
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
    setCandidates(SEED_CANDIDATES);
    setOrders(buildSeedOrders(SEED_CANDIDATES, INITIAL_CATEGORIES, INITIAL_PRICING));
    setCart([]); setPromo(null); setPurchasedIds([]); setBuyer({ name: '', email: '', company: '' });
    toast('Demo data restored');
  };

  /* ---- derived pricing & lookups ---- */
  const priceOf = useCallback((c) => computePrice(c, categories, pricing), [categories, pricing]);
  const purchasedSet = useMemo(() => new Set(purchasedIds), [purchasedIds]);
  const isUnlocked = (id) => purchasedSet.has(id);
  const rolesFor = (industryName) => categories.find((c) => c.name === industryName)?.roles || [];
  const getCandidate = (id) => candidates.find((c) => c.id === id);

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
      } else {
        const cs = item.candidateIds.map((id) => candidates.find((x) => x.id === id)).filter((c) => c && c.status === 'Active');
        if (cs.length) {
          const gross = cs.reduce((s, c) => s + priceOf(c), 0);
          out.push({ ...item, candidates: cs, gross, price: round2((gross * (100 - item.discount)) / 100) });
        }
      }
    });
    return out;
  }, [cart, candidates, priceOf]);

  const cartTotals = useMemo(() => {
    const gross = cartItems.reduce((s, i) => s + i.gross, 0);
    const subtotal = round2(cartItems.reduce((s, i) => s + i.price, 0));
    const promoDiscount = promo && subtotal >= promo.min ? round2((subtotal * promo.pct) / 100) : 0;
    const ids = new Set(cartItems.flatMap((i) => i.candidates.map((c) => c.id)));
    return { gross: round2(gross), subtotal, bundleSavings: round2(gross - subtotal), promoDiscount, total: round2(subtotal - promoDiscount), leadCount: ids.size };
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
      return i.type === 'lead'
        ? { type: 'lead', name: `${i.candidate.role} · ${i.candidate.id}`, count: 1, price: i.price }
        : { type: 'bundle', name: i.name, count: i.candidates.length, price: i.price, gross: i.gross, discount: i.discount };
    });
    const { subtotal, bundleSavings, promoDiscount, total } = cartTotals;
    const factor = subtotal ? total / subtotal : 1;
    return {
      id: `ORD-${5000 + orders.length + 1}`,
      date: new Date().toISOString(),
      buyer: buyerInfo.name, email: buyerInfo.email, company: buyerInfo.company, method,
      items,
      lines: lines.map((l) => ({ ...l, paid: round2(l.price * factor) })),
      candidateIds: [...new Set(lines.map((l) => l.candidateId))],
      subtotal, bundleSavings, promoCode: promoDiscount ? promo.code : null, promoDiscount, total,
      downloads: [], mine: true,
    };
  };

  const commitOrder = (order) => {
    setOrders((o) => [order, ...o]);
    setPurchasedIds((p) => [...new Set([...p, ...order.candidateIds])]);
    setBuyer({ name: order.buyer, email: order.email, company: order.company });
    setCart([]);
    setPromo(null);
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

  const value = {
    categories, pricing, candidates, orders, cart, promo, purchasedIds, buyer, toasts, adminAuthed,
    cartOpen, menuOpen, previewId, checkoutOpen,
    setCartOpen, setMenuOpen, setPreviewId, setCheckoutOpen, setPromo, toast, adminLogin, adminLogout, resetDemo,
    priceOf, isUnlocked, rolesFor, getCandidate, resolveBundle,
    cartItems, cartTotals, inCart, addLead, addBundle, removeFromCart, applyPromo, prepareOrder, commitOrder, exportLeads,
    addCandidate, updateCandidate, deleteCandidate,
    setBasePrice, setRarity, setCategoryColor, renameCategory, addCategory, deleteCategory, addRole, deleteRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
