"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import CompanyProfileFooter from '@/components/CompanyProfileFooter';
import ProfileFooter from '@/components/ProfileFooter';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile';
  const isCompanyProfilePage = pathname.startsWith('/companies/');
  const isVideosPage = pathname === '/videos';

  const shouldShowMainHeader = !isProfilePage && !isCompanyProfilePage && !isVideosPage;
  
  // This logic determines which footer to show, or none at all.
  const getFooter = () => {
    if (isProfilePage) {
      // Show the specific footer for the user's own profile page
      return <ProfileFooter />;
    }
    if (isCompanyProfilePage) {
      // Show the specific footer for a company's profile page
      return <CompanyProfileFooter />;
    }
    // Show the main footer on all other pages (including videos)
    return <Footer />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowMainHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {getFooter()}
    </div>
  );
}
