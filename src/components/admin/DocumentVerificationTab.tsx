'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Eye, ShieldAlert, ShieldCheck, ShieldX, Slash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import type { User } from '@/lib/types';
import { rejectUserId, toggleUserPause, verifyUserId } from '@/lib/actions/admin.actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Label } from '@/components/ui/label'; // Added missing import


export function DocumentVerificationTab() {
  const { users } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const usersToReview = users.filter(u => u.idVerificationStatus === 'pending' || u.idVerificationStatus === 'rejected');
  
  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setRejectionReason('');
    setIsDialogOpen(true);
  }

  const handleApprove = async () => {
      if (!selectedUser) return;
      await verifyUserId(selectedUser.id);
      toast({ title: "Usuario Aprobado", description: `La cuenta de ${selectedUser.name} ha sido verificada.` });
      setIsDialogOpen(false);
  }

  const handleReject = async () => {
      if (!selectedUser || !rejectionReason) {
        toast({ variant: 'destructive', title: "Error", description: "Por favor, especifica un motivo para el rechazo." });
        return;
      }
      await rejectUserId(selectedUser.id, rejectionReason);
      toast({ title: "Usuario Rechazado", description: `Se ha notificado a ${selectedUser.name} el motivo del rechazo.` });
      setIsDialogOpen(false);
  }

  const handleTogglePause = async () => {
      if (!selectedUser) return;
      await toggleUserPause(selectedUser.id, selectedUser.isPaused || false);
      toast({
          title: `Cuenta ${selectedUser.isPaused ? 'Reactivada' : 'Pausada'}`,
          description: `Las transacciones de ${selectedUser.name} han sido ${selectedUser.isPaused ? 'habilitadas' : 'deshabilitadas'}.`
      });
      setIsDialogOpen(false);
  }

  const getStatusIcon = (status: User['idVerificationStatus']) => {
      switch(status) {
          case 'pending': return <ShieldAlert className="h-5 w-5 text-yellow-500"/>;
          case 'rejected': return <ShieldX className="h-5 w-5 text-red-500"/>;
          default: return null;
      }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Revisión de Documentos</CardTitle>
        <CardDescription>Gestiona la verificación de identidad de los nuevos usuarios.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersToReview.length > 0 ? (
                usersToReview.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={user.profileImage} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-medium">{user.name} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {getStatusIcon(user.idVerificationStatus)}
                            <span className="capitalize">{user.idVerificationStatus}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenDialog(user)}>
                         <Eye className="mr-2 h-4 w-4"/>
                         Revisar y Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">No hay usuarios pendientes de revisión.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent className="max-w-4xl">
          {selectedUser && (
              <>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Revisión de: {selectedUser.name}</AlertDialogTitle>
                      <AlertDialogDescription>
                          Verifica el documento, gestiona el estado de la cuenta y comunícate con el usuario.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <h4 className="font-semibold mb-2">Documento Cargado</h4>
                            {selectedUser.idDocumentUrl ? (
                                <div className="relative aspect-[1.58] w-full rounded-md overflow-hidden border">
                                    <Image src={selectedUser.idDocumentUrl} alt={`Documento de ${selectedUser.name}`} fill style={{objectFit: 'contain'}} sizes="(max-width: 768px) 100vw, 50vw"/>
                                </div>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4"/>
                                    <AlertTitle>No hay documento</AlertTitle>
                                    <AlertDescription>Este usuario no ha cargado un documento de identidad.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div>
                           <h4 className="font-semibold mb-2">Datos de Registro</h4>
                           <div className="space-y-2 text-sm p-4 bg-muted rounded-md mb-4">
                               <p><strong>Nombre:</strong> {selectedUser.name} {selectedUser.lastName}</p>
                               <p><strong>Email:</strong> {selectedUser.email}</p>
                               <p><strong>ID Registrado:</strong> {selectedUser.idNumber}</p>
                               <p><strong>País:</strong> {selectedUser.country}</p>
                           </div>

                           {selectedUser.idVerificationStatus === 'rejected' && selectedUser.idRejectionReason && (
                                <Alert variant="destructive" className="mb-4">
                                    <ShieldX className="h-4 w-4"/>
                                    <AlertTitle>Rechazado Previamente</AlertTitle>
                                    <AlertDescription>Motivo: {selectedUser.idRejectionReason}</AlertDescription>
                                </Alert>
                           )}

                           <div className="space-y-2">
                             <h4 className="font-semibold mb-2">Acciones de Gestión</h4>
                              <Button className="w-full justify-start" onClick={handleApprove}><ShieldCheck className="mr-2 h-4 w-4"/>Aprobar Verificación</Button>
                              <Button variant="destructive" className="w-full justify-start" onClick={handleTogglePause}>
                                  {selectedUser.isPaused ? <Check className="mr-2 h-4 w-4"/> : <Slash className="mr-2 h-4 w-4"/>}
                                  {selectedUser.isPaused ? 'Reactivar Cuenta' : 'Pausar Cuenta'}
                              </Button>
                              <div className="pt-2">
                                  <Label htmlFor="rejectionReason" className="font-semibold">Motivo de Rechazo (si aplica)</Label>
                                  <Textarea 
                                    id="rejectionReason"
                                    placeholder="Ej: La imagen del documento es borrosa..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="mt-1"
                                  />
                                  <Button variant="outline" className="w-full mt-2" onClick={handleReject} disabled={!rejectionReason}>Rechazar y Notificar</Button>
                              </div>
                           </div>
                        </div>
                  </div>
                  <AlertDialogFooter className="pt-4">
                      <AlertDialogCancel>Cerrar</AlertDialogCancel>
                  </AlertDialogFooter>
              </>
          )}
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
