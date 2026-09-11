"use client";

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GuidedTour from '@/components/GuidedTour';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Do not show dashboard layout on public landing page or login page
  const isPublicOrLogin = pathname === '/' || pathname === '/login';

  if (isPublicOrLogin) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <GuidedTour />
    </>
  );
}
