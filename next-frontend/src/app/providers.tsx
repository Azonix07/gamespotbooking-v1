'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/context/AuthContext';

/* ── Lazy-load heavy components so they don't block initial paint ── */
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

/* Google OAuth is ~50 KB — only wrap pages that actually need it */
const GoogleOAuthProvider = dynamic(
  () => import('@react-oauth/google').then((m) => m.GoogleOAuthProvider),
  { ssr: false }
);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '556892794157-0ou93bns5ok2n32nk3nruhhnf4juog1h.apps.googleusercontent.com';

const NEEDS_GOOGLE_AUTH = new Set(['/login', '/signup', '/forgot-password']);

function ThemeLoader() {
  useEffect(() => {
    const cachedTheme = localStorage.getItem('selectedTheme');
    const cacheTime = localStorage.getItem('selectedTheme_ts');
    if (cachedTheme) {
      document.documentElement.setAttribute('data-theme', cachedTheme);
    }
    /* Skip refetch if theme was fetched less than 5 minutes ago */
    if (cacheTime && Date.now() - Number(cacheTime) < 300_000) return;
    
    /* Fetch theme in a non-blocking microtask */
    const controller = new AbortController();
    const fetchTheme = async () => {
      try {
        const res = await fetch(`/api/theme`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.theme) {
            document.documentElement.setAttribute('data-theme', data.theme);
            localStorage.setItem('selectedTheme', data.theme);
            localStorage.setItem('selectedTheme_ts', String(Date.now()));
          }
        }
      } catch { /* ignore */ }
    };
    fetchTheme();
    return () => controller.abort();
  }, []);
  return null;
}

// Pages that have NO Navbar at all
const NO_NAVBAR_PAGES = new Set(['/', '/admin/dashboard', '/invite']);

// Pages that have NO Footer
const NO_FOOTER_PAGES = new Set([
  '/', '/admin/dashboard', '/invite', '/login', '/signup',
  '/forgot-password', '/verify-email', '/profile',
]);

// HomePage uses dark navbar (default); all other pages use light variant
const DARK_NAVBAR_PAGES = new Set(['/']);

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Memoize layout flags — avoids recalculating on every render */
  const layout = useMemo(() => {
    const isAdmin = pathname.startsWith('/admin');
    return {
      isAdmin,
      showNavbar: !isAdmin && !NO_NAVBAR_PAGES.has(pathname),
      showFooter: !NO_FOOTER_PAGES.has(pathname),
      navbarVariant: DARK_NAVBAR_PAGES.has(pathname) ? 'dark' as const : 'light' as const,
    };
  }, [pathname]);

  // Admin pages have their own full-screen sidebar layout — no app-wrapper
  if (layout.isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="app-wrapper" suppressHydrationWarning>
      {mounted && layout.showNavbar && <Navbar variant={layout.navbarVariant} />}
      <main className="main-content gs-page-enter">
        {children}
      </main>
      {mounted && layout.showFooter && <Footer />}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const needsGoogleAuth = NEEDS_GOOGLE_AUTH.has(pathname);

  /* Core tree — always rendered */
  const tree = (
    <AuthProvider>
      <ThemeLoader />
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );

  /* Only wrap with GoogleOAuthProvider on pages that need it */
  if (needsGoogleAuth) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {tree}
      </GoogleOAuthProvider>
    );
  }

  return tree;
}
