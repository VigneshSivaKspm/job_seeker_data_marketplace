import React, { Suspense, lazy } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { AppProvider } from './context/AppContext.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import AdminLayout, { AdminLogin } from './pages/admin/AdminLayout.jsx';
import { Btn, EmptyState, ScrollToTop, Spinner } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Join from './pages/Join.jsx';
import Marketplace, { BundlesTab, Catalog, PackagesTab, PurchasesTab } from './pages/Marketplace.jsx';

// The admin console is code-split so job seekers never download it.
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const PricingPage = lazy(() => import('./pages/admin/Manage.jsx').then((m) => ({ default: m.PricingPage })));
const CandidatesPage = lazy(() => import('./pages/admin/Manage.jsx').then((m) => ({ default: m.CandidatesPage })));
const OrdersPage = lazy(() => import('./pages/admin/Manage.jsx').then((m) => ({ default: m.OrdersPage })));

const Loading = () => <div className="flex h-64 items-center justify-center text-indigo-500"><Spinner size={28} /></div>;
const lazyEl = (el) => <Suspense fallback={<Loading />}>{el}</Suspense>;

function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <EmptyState icon={Compass} title="Page not found" text="The page you're looking for doesn't exist or has moved." action={<Btn as={Link} to="/">Back to home</Btn>} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="join" element={<Join />} />
          <Route path="marketplace" element={<Marketplace />}>
            <Route index element={<Catalog />} />
            <Route path="packages" element={<PackagesTab />} />
            <Route path="bundles" element={<BundlesTab />} />
            <Route path="purchases" element={<PurchasesTab />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={lazyEl(<Dashboard />)} />
          <Route path="pricing" element={lazyEl(<PricingPage />)} />
          <Route path="candidates" element={lazyEl(<CandidatesPage />)} />
          <Route path="orders" element={lazyEl(<OrdersPage />)} />
        </Route>
      </Routes>
    </AppProvider>
  );
}