
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Banknote, ShieldCheck, FileText, AlertTriangle, KeyRound, Link as LinkIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import * as Actions from '@/lib/actions';

function SettingsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold">Ajustes del Registro</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

// Reusable component for settings sections that act as links
function SettingsLinkCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType,
  title: string,
  description: string,
  href: string,
}) {
    const Icon = icon;
    return (
        <Link href={href} passHref>
            <Card className="hover:border-primary hover:bg-muted/30 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Icon className="h-8 w-8 text-primary shrink-0" />
                    <div>
                        <CardTitle className="text-xl">{title}</CardTitle>
                        <CardDescription className="mt-1">{description}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    );
}

export default function TransactionsSettingsPage() {
    const { currentUser } = useCorabo();
    const router = useRouter();

    if (!currentUser) {
        return null; // Or a loading state
    }

    const isCompany = currentUser.profileSetupData?.providerType === 'company';

    return (
        <>
            <SettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto space-y-4">
                 <SettingsLinkCard
                    icon={Banknote}
                    title="Métodos de Pago"
                    description="Gestiona cómo recibirás los pagos (cuentas, pago móvil, etc.)."
                    href="/transactions/settings/payment-methods"
                />

                {isCompany && (
                     <SettingsLinkCard
                        icon={KeyRound}
                        title="Gestión de Cajas"
                        description="Crea y administra los puntos de venta y QR para tu negocio."
                        href="/transactions/settings/cashier"
                    />
                )}

                 <SettingsLinkCard
                    icon={FileText}
                    title="Políticas y Documentación"
                    description="Revisa los términos y condiciones del Registro de Transacciones."
                    href="/policies"
                />

                <Card className="border-destructive mt-8">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5"/>
                        Zona de Peligro
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Desactivar Registro de Transacciones
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Al desactivar el registro, no podrás recibir pagos ni gestionar transacciones a través de Corabo. Tu cuenta no será eliminada, pero esta funcionalidad quedará inactiva.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => Actions.deactivateTransactions(currentUser.id)}>Sí, desactivar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>

            </main>
        </>
    );
}
