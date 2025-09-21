
import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth-provider';
import ClientLayout from './ClientLayout'; // Import ClientLayout

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${'${inter.variable}'} antialiased bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
                {/* ClientLayout now lives inside AuthProvider to access auth state */}
                {/* CoraboProvider is now INSIDE ClientLayout, conditionally rendered */}
                <ClientLayout>
                  {children}
                </ClientLayout>
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
