
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Info, ShieldHalf, Loader2, FileWarning, User, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Transaction, ContentReport, User as CoraboUser, SanctionReason } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/lib/actions/messaging.actions';
import { TransactionDetailsDialog } from '@/components/TransactionDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import { initiateDisputeResolution } from '@/lib/actions/dispute.actions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { approveContentReport, rejectContentReport } from '@/lib/actions/report.actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

const sanctionReasons: SanctionReason[] = [
    "Contenido Engañoso o Spam",
    "Suplantación de Identidad",
    "Incitación al Odio o Acoso",
    "Promoción de Actividades Ilegales",
    "Contenido Explícito o Inapropiado",
];

function SanctionDialog({
    report,
    onOpenChange,
    onConfirm
}: {
    report: ContentReport;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reportId: string, contentId: string, reportedUserId: string, reason: SanctionReason) => void;
}) {
    const [selectedReason, setSelectedReason] = useState<SanctionReason | null>(null);

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Aprobar Denuncia y Sancionar</AlertDialogTitle>
                <AlertDialogDescription>
                    Selecciona el motivo de la sanción. Esto eliminará la publicación y notificará al usuario.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <RadioGroup onValueChange={(value) => setSelectedReason(value as SanctionReason)}>
                    {sanctionReasons.map(reason => (
                        <div key={reason} className="flex items-center space-x-2">
                            <RadioGroupItem value={reason} id={reason} />
                            <Label htmlFor={reason}>{reason}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => {
                        if (selectedReason) {
                            onConfirm(report.id, report.reportedContentId, report.reportedUserId, selectedReason);
                        }
                    }}
                    disabled={!selectedReason}
                >
                    Confirmar Sanción
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}


interface DisputeManagementTabProps {
  selectedCountry: string | null;
}

export function DisputeManagementTab({ selectedCountry }: DisputeManagementTabProps) {
  const { currentUser, users, transactions } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [contentReports, setContentReports] = useState<ContentReport[]>([]);
  const [sanctionDialogReport, setSanctionDialogReport] = useState<ContentReport | null>(null);


  // Listener for content reports
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'reports'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContentReports(snapshot.docs.map(doc => doc.data() as ContentReport));
    });
    return () => unsubscribe();
  }, []);


  const disputeCases = useMemo(() => {
    if(!transactions || !users) return [];
    return transactions
      .filter(tx => {
        const client = users.find(u => u.id === tx.clientId);
        return tx.status === 'En Disputa' &&
               (!selectedCountry || client?.country === selectedCountry);
      })
      .map(tx => {
        const client = users.find(u => u.id === tx.clientId);
        const provider = users.find(u => u.id === tx.providerId);
        return {
          transaction: tx,
          client,
          provider,
        };
      })
      .filter(caseItem => !!caseItem.client && !!caseItem.provider);
  }, [transactions, users, selectedCountry]);
  
  const filteredContentReports = useMemo(() => {
     if (!selectedCountry) return contentReports;
     return contentReports.filter(report => {
         const reportedUser = users.find(u => u.id === report.reportedUserId);
         return reportedUser?.country === selectedCountry;
     });
  }, [contentReports, selectedCountry, users]);

  const handleContact = (partyId: string, message: string) => {
      if (!currentUser) return;
      const conversationId = [currentUser.id, partyId].sort().join('-');
      sendMessage({
          senderId: currentUser.id,
          recipientId: partyId,
          conversationId,
          text: message
      });
      router.push(`/messages/${conversationId}`);
  };

  const handleResolveDispute = async (txId: string) => {
    if (!currentUser) return;
    setIsLoading(txId);
    try {
        await initiateDisputeResolution(txId, currentUser.id);
        toast({
            title: 'Caso de Disputa Iniciado',
            description: 'Las partes han sido notificadas y el caso ha sido registrado.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error al iniciar caso',
            description: error.message,
        });
    } finally {
        setIsLoading(null);
    }
  };
  
  const handleApproveReport = async (reportId: string, contentId: string, reportedUserId: string, sanctionReason: SanctionReason) => {
      await approveContentReport(reportId, contentId, reportedUserId, sanctionReason);
      toast({ title: 'Contenido Eliminado', description: 'La denuncia ha sido aprobada y el contenido eliminado.' });
      setSanctionDialogReport(null);
  }

  const handleRejectReport = async (reportId: string) => {
      await rejectContentReport(reportId);
      toast({ title: 'Denuncia Descartada', description: 'La denuncia ha sido marcada como resuelta.' });
  }


  return (
    <>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileWarning className="w-5 h-5"/>Denuncias de Contenido Pendientes</CardTitle>
                    <CardDescription>Revisa el contenido denunciado por los usuarios y toma acciones.</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredContentReports.length > 0 ? (
                    <div className="space-y-4">
                      {filteredContentReports.map(report => {
                        const reporter = users.find(u => u.id === report.reporterId);
                        const reportedUser = users.find(u => u.id === report.reportedUserId);
                        return (
                          <div key={report.id} className="border p-4 rounded-lg flex flex-col sm:flex-row gap-4 justify-between">
                            <div>
                              <p className="font-bold">{report.reason}</p>
                              <p className="text-sm text-muted-foreground">{report.description || "Sin descripción adicional."}</p>
                              <div className="text-xs mt-2 space-x-2">
                                <Badge variant="outline">Reportado por: {reporter?.name || 'Usuario Anónimo'}</Badge>
                                <Badge variant="outline">Dueño: {reportedUser?.name || 'N/A'}</Badge>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center pt-2 sm:pt-0 border-t sm:border-none w-full sm:w-auto">
                              <Button asChild variant="secondary" size="sm"><a href={`/publications/${report.reportedContentId}`} target="_blank"><Eye className="mr-2 h-4 w-4"/>Ver Contenido</a></Button>
                               <Button variant="destructive" size="sm" onClick={() => setSanctionDialogReport(report)}><Trash2 className="mr-2 h-4 w-4"/>Aprobar Denuncia</Button>
                               <Button variant="outline" size="sm" onClick={() => handleRejectReport(report.id)}>Descartar</Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground"><p>No hay denuncias de contenido pendientes.</p></div>
                  )}
                </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Gestión de Disputas y Reclamos</CardTitle>
                <CardDescription>
                Media en las transacciones marcadas como &quot;En Disputa&quot; para llegar a una resolución.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {disputeCases.length > 0 ? (
                <div className="space-y-4">
                    {disputeCases.map(({ transaction, client, provider }) => (
                    <div key={transaction.id} className="border p-4 rounded-lg flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex gap-4">
                            <div>
                                <p className="font-bold">{transaction.details.serviceName || 'Transacción de Compra'}</p>
                                <p className="text-sm text-muted-foreground">ID: {transaction.id.slice(-6)}</p>
                                <Badge variant="destructive" className="mt-1">
                                    ${transaction.amount.toFixed(2)} - En Disputa
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-start sm:items-end text-sm">
                            <p><strong>Cliente:</strong> {client?.name}</p>
                            <p><strong>Proveedor:</strong> {provider?.name}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center pt-2 sm:pt-0 border-t sm:border-none w-full sm:w-auto">
                            <Button size="sm" variant="outline" onClick={() => setSelectedTransaction(transaction)}>
                                <Info className="mr-2 h-4 w-4"/>Ver Detalle
                            </Button>
                            <Button size="sm" onClick={() => handleContact(client!.id, `Hola ${client!.name}, te contactamos sobre la disputa en la transacción #${transaction.id.slice(-6)}.`)}>
                                Contactar Cliente
                            </Button>
                            <Button size="sm" onClick={() => handleContact(provider!.id, `Hola ${provider!.name}, te contactamos sobre la disputa en la transacción #${transaction.id.slice(-6)}.`)}>
                                Contactar Proveedor
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleResolveDispute(transaction.id)} disabled={isLoading === transaction.id}>
                                {isLoading === transaction.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldHalf className="mr-2 h-4 w-4" />}
                                Resolver Caso
                            </Button>
                        </div>
                    </div>
                    ))}
                </div>
                ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No hay disputas activas para el país seleccionado.</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
        <TransactionDetailsDialog 
            isOpen={!!selectedTransaction}
            onOpenChange={() => setSelectedTransaction(null)}
            transaction={selectedTransaction}
        />
        {sanctionDialogReport && (
            <AlertDialog open={!!sanctionDialogReport} onOpenChange={() => setSanctionDialogReport(null)}>
                <SanctionDialog 
                    report={sanctionDialogReport} 
                    onOpenChange={() => setSanctionDialogReport(null)}
                    onConfirm={handleApproveReport} 
                />
            </AlertDialog>
        )}
    </>
  );
}
