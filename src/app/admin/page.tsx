
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Shield, Home, Users, Banknote, ShieldAlert, BadgeInfo, Handshake } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagementTab } from '@/components/admin/UserManagementTab';
import { PaymentVerificationTab } from '@/components/admin/PaymentVerificationTab';
import { DocumentVerificationTab } from '@/components/admin/DocumentVerificationTab';
import { AffiliationManagementTab } from '@/components/admin/AffiliationManagementTab';

function AdminHeader() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
                 <Shield className="h-6 w-6 text-primary" />
                 <h1 className="text-xl font-bold">Panel de Administración</h1>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Hola, {currentUser?.name}</span>
                 <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                    <Home className="mr-2 h-4 w-4" />
                    Ir a la App
                 </Button>
                <Button variant="destructive" size="sm" onClick={logout}>Cerrar Sesión</Button>
            </div>
        </div>
      </div>
    </header>
  );
}


export default function AdminPage() {
    const { currentUser } = useAuth();

    if(currentUser?.role !== 'admin') {
        // This is a fallback, AppLayout should prevent this render.
        return null; 
    }
    
    const isCompany = currentUser.profileSetupData?.providerType === 'company';

  return (
    <>
      <AdminHeader />
      <main className="container max-w-7xl mx-auto py-8">
        <Tabs defaultValue="user-management">
          <TabsList className={isCompany ? "grid w-full grid-cols-4 md:grid-cols-5" : "grid w-full grid-cols-3 md:grid-cols-5"}>
            <TabsTrigger value="user-management"><Users className="w-4 h-4 mr-2" />Usuarios</TabsTrigger>
            <TabsTrigger value="payment-verification"><Banknote className="w-4 h-4 mr-2" />Pagos</TabsTrigger>
            <TabsTrigger value="document-verification"><BadgeInfo className="w-4 h-4 mr-2" />Documentos</TabsTrigger>
            {isCompany && <TabsTrigger value="affiliations"><Handshake className="w-4 h-4 mr-2" />Talento Asociado</TabsTrigger>}
            <TabsTrigger value="disputes" disabled><ShieldAlert className="w-4 h-4 mr-2" />Disputas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user-management" className="mt-4">
            <UserManagementTab />
          </TabsContent>
          <TabsContent value="payment-verification" className="mt-4">
             <PaymentVerificationTab />
          </TabsContent>
          <TabsContent value="document-verification" className="mt-4">
            <DocumentVerificationTab />
          </TabsContent>
          {isCompany && (
             <TabsContent value="affiliations" className="mt-4">
                <AffiliationManagementTab />
            </TabsContent>
          )}
          {/* Placeholder for future tabs */}
          <TabsContent value="disputes"><p>Gestión de disputas próximamente.</p></TabsContent>
        </Tabs>
      </main>
    </>
  );
}
