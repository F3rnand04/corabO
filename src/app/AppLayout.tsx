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
  const shouldShowMainFooter = !isProfilePage && !isCompanyProfilePage && !isVideosPage;

  const getFooter = () => {
    if (isProfilePage) {
      return <ProfileFooter />;
    }
    if (isCompanyProfilePage) {
      return <CompanyProfileFooter />;
    }
    if (shouldShowMainFooter) {
      return <Footer />;
    }
    return null;
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
