'use client';

import { useAuth } from '@/hooks/use-auth-provider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Shield, Home, Users, Banknote, ShieldAlert, BadgeInfo, Handshake } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagementTab } from '@/components/admin/UserManagementTab';
import { PaymentVerificationTab } from '@/components/admin/PaymentVerificationTab';
import { DocumentVerificationTab } from '@/components/admin/DocumentVerificationTab';
import { AffiliationManagementTab } from '@/components/admin/AffiliationManagementTab';
import { useState } from 'react';
import { DisputeManagementTab } from '@/components/admin/disputes/DisputeManagementTab';
import { AccountingTab } from '@/components/admin/AccountingTab';
import { CollectionsManagementTab } from '@/components/admin/collections/CollectionsManagementTab';
import { ExchangeRateDialog } from '@/components/admin/ExchangeRateDialog';
import { TeamManagementDialog } from '@/components/admin/TeamManagementDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/data/options';

function AdminHeader() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isExchangeRateDialogOpen, setIsExchangeRateDialogOpen] = useState(false);

  return (
    <>
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
                   {currentUser?.email === 'corabo.app@gmail.com' && (
                     <>
                      <Button variant="secondary" size="sm" onClick={() => setIsExchangeRateDialogOpen(true)}>Tasa de Cambio</Button>
                      <Button variant="secondary" size="sm" onClick={() => setIsTeamDialogOpen(true)}>Equipo</Button>
                     </>
                   )}
              </div>
          </div>
        </div>
      </header>
      <TeamManagementDialog isOpen={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen} />
      <ExchangeRateDialog isOpen={isExchangeRateDialogOpen} onOpenChange={setIsExchangeRateDialogOpen} />
    </>
  );
}


export default function AdminPage() {
    const { currentUser } = useAuth();
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        // This is a fallback, AppLayout should prevent this render.
        return null;
    }
    
    const isCompany = currentUser.profileSetupData?.providerType === 'company';
    const isSuperAdmin = currentUser.email === 'corabo.app@gmail.com';

    const managementRole = currentUser.managementRole;

    const availableTabs = [
        { value: 'user-management', label: 'Usuarios', icon: Users, roles: ['admin'] },
        { value: 'payment-verification', label: 'Pagos', icon: Banknote, roles: ['admin', 'payment_verifier', 'accountant'] },
        { value: 'document-verification', label: 'Documentos', icon: BadgeInfo, roles: ['admin', 'document_verifier'] },
        { value: 'affiliations', label: 'Talento Asociado', icon: Handshake, roles: ['admin', 'affiliation_manager'], companyOnly: true },
        { value: 'disputes', label: 'Disputas', icon: ShieldAlert, roles: ['admin', 'dispute_manager', 'customer_support'] },
        { value: 'collections', label: 'Cobranzas', icon: Banknote, roles: ['admin', 'dispute_manager'] },
        { value: 'accounting', label: 'Contabilidad', icon: Banknote, roles: ['admin', 'accountant'] },
    ];

    const userTabs = isSuperAdmin 
        ? availableTabs 
        : availableTabs.filter(tab => tab.roles.includes(managementRole || ''));

    const defaultTab = userTabs.length > 0 ? userTabs[0].value : '';
    

  return (
    <>
      <AdminHeader />
      <main className="container max-w-7xl mx-auto py-8">
        <Tabs defaultValue={defaultTab}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <TabsList className="flex-wrap h-auto">
                 {userTabs.map(tab => {
                      if (tab.companyOnly && !isCompany) return null;
                      const Icon = tab.icon;
                      return (
                          <TabsTrigger key={tab.value} value={tab.value}>
                              <Icon className="w-4 h-4 mr-2" />{tab.label}
                          </TabsTrigger>
                      )
                  })}
              </TabsList>
               {isSuperAdmin && (
                 <div className="w-full sm:w-auto">
                    <Select onValueChange={setSelectedCountry} defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por País" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los Países</SelectItem>
                        {countries.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
              )}
            </div>
          
          <TabsContent value="user-management"><UserManagementTab /></TabsContent>
          <TabsContent value="payment-verification"><PaymentVerificationTab /></TabsContent>
          <TabsContent value="document-verification"><DocumentVerificationTab /></TabsContent>
          <TabsContent value="affiliations">{isCompany && <AffiliationManagementTab />}</TabsContent>
          <TabsContent value="disputes"><DisputeManagementTab selectedCountry={selectedCountry} /></TabsContent>
          <TabsContent value="collections"><CollectionsManagementTab selectedCountry={selectedCountry} /></TabsContent>
          <TabsContent value="accounting"><AccountingTab selectedCountry={selectedCountry} /></TabsContent>

        </Tabs>
      </main>
    </>
  );
}
