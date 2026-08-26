'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';

// Routes that should NOT show the marketing navbar/footer
const APP_ROUTES = ['/dashboard', '/login', '/portal', '/forms'];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = APP_ROUTES.some((route) => pathname?.startsWith(route));

  return (
    <>
      {!isAppRoute && <Navbar />}
      {children}
      {!isAppRoute && <Footer />}
    </>
  );
}
