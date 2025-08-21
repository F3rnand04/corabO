

'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Eye, Loader2, Sparkles, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import type { User, VerificationOutput } from '@/lib/types';
import * as Actions from '@/lib/actions';

export function DocumentVerificationTab() {
  const { users } = useCorabo();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationOutput | { error: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pendingUsers = users.filter(u => u.idVerificationStatus === 'pending');
  
  const handleAutoVerify = async (user: User) => {
      setIsVerifying(true);
      setVerificationResult(null);
      try {
          const result = await Actions.autoVerifyIdWithAI(user);
          setVerificationResult(result);
      } catch (error) {
          console.error(error);
          setVerificationResult({ error: 'Fallo al ejecutar la verificación por IA.' });
      } finally {
          setIsVerifying(false);
      }
  };

  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setVerificationResult(null);
    setIsVerifying(false);
    setIsDialogOpen(true);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Verificación de Documentos</CardTitle>
        <CardDescription>Revisa los documentos de identidad para verificar las cuentas de los usuarios.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha de Solicitud</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.length > 0 ? (
                pendingUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={user.profileImage} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell> {/* Placeholder */}
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenDialog(user)}>
                         <Eye className="mr-2 h-4 w-4"/>
                         Revisar Documento
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">No hay documentos pendientes de revisión.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent className="max-w-3xl">
          {selectedUser && (
              <>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Verificar a {selectedUser.name}</AlertDialogTitle>
                      <AlertDialogDescription>
                          Compara el documento con la información de registro. Usa la verificación por IA como apoyo.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div>
                            <h4 className="font-semibold mb-2">Documento Cargado</h4>
                            <div className="relative aspect-[1.58] w-full rounded-md overflow-hidden border">
                                <Image src={selectedUser.idDocumentUrl!} alt={`Documento de ${selectedUser.name}`} fill style={{objectFit: 'contain'}} sizes="400px"/>
                            </div>
                        </div>
                        <div>
                           <h4 className="font-semibold mb-2">Datos de Registro</h4>
                           <div className="space-y-2 text-sm p-4 bg-muted rounded-md">
                               <p><strong>Nombre:</strong> {selectedUser.name} {selectedUser.lastName}</p>
                               <p><strong>Email:</strong> {selectedUser.email}</p>
                               <p><strong>ID (simulado):</strong> {selectedUser.idNumber}</p>
                           </div>
                           <Button className="w-full mt-4" onClick={() => handleAutoVerify(selectedUser)} disabled={isVerifying}>
                                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                {isVerifying ? 'Verificando con IA...' : 'Auto-Verificar con IA'}
                           </Button>
                           {verificationResult && 'error' in verificationResult && (
                                <p className="text-destructive text-sm mt-2">{verificationResult.error}</p>
                            )}
                           {verificationResult && !('error' in verificationResult) && (
                                <div className="mt-4 p-3 rounded-md border text-sm">
                                    <h5 className="font-semibold mb-2">Resultado de la IA:</h5>
                                    {verificationResult.nameMatch === true && <p className="text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4"/> Nombre Coincide</p>}
                                    {verificationResult.nameMatch === false && <p className="text-destructive flex items-center gap-2"><XCircle className="h-4 w-4"/> Nombre NO Coincide (IA leyó: "{verificationResult.extractedName}")</p>}
                                    {verificationResult.idMatch === true && <p className="text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4"/> ID Coincide</p>}
                                    {verificationResult.idMatch === false && <p className="text-destructive flex items-center gap-2"><XCircle className="h-4 w-4"/> ID NO Coincide (IA leyó: "{verificationResult.extractedId}")</p>}
                                </div>
                            )}
                        </div>
                  </div>
                  <AlertDialogFooter>
                      <Button variant="destructive" onClick={() => { selectedUser && Actions.rejectUserId(selectedUser.id); setIsDialogOpen(false);}}>Rechazar</Button>
                      <div className="flex-grow"></div>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { selectedUser && Actions.verifyUserId(selectedUser.id); setIsDialogOpen(false);}}>Aprobar Verificación</AlertDialogAction>
                  </AlertDialogFooter>
              </>
          )}
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
