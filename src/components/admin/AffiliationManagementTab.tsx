
'use client';

import { useState, useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Affiliation, User } from '@/lib/types';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

export function AffiliationManagementTab() {
  const { currentUser, users, approveAffiliation, rejectAffiliation, revokeAffiliation } = useCorabo();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const db = getFirestore();
    const q = query(collection(db, 'affiliations'), where('companyId', '==', currentUser.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const affs = snapshot.docs.map(doc => doc.data() as Affiliation);
      setAffiliations(affs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getProfessionalById = (id: string) => users.find(u => u.id === id);

  const pendingAffiliations = affiliations.filter(a => a.status === 'pending');
  const approvedAffiliations = affiliations.filter(a => a.status === 'approved');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Afiliación Pendientes</CardTitle>
          <CardDescription>Aprueba o rechaza las solicitudes de los profesionales para unirse a tu empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesional</TableHead>
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>
              ) : pendingAffiliations.length > 0 ? (
                pendingAffiliations.map(aff => {
                  const professional = getProfessionalById(aff.providerId);
                  if (!professional) return null;
                  return (
                    <TableRow key={aff.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={professional.profileImage} />
                            <AvatarFallback>{professional.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{professional.name}</p>
                            <p className="text-sm text-muted-foreground">{professional.profileSetupData?.specialty}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(aff.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-green-600" onClick={() => approveAffiliation(aff.id)}>
                          <Check className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => rejectAffiliation(aff.id)}>
                          <X className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center">No hay solicitudes pendientes.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profesionales Afiliados</CardTitle>
          <CardDescription>Esta es la lista de profesionales actualmente verificados por tu empresa.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesional</TableHead>
                <TableHead>Fecha Aprobación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>
              ) : approvedAffiliations.length > 0 ? (
                approvedAffiliations.map(aff => {
                    const professional = getProfessionalById(aff.providerId);
                    if (!professional) return null;
                     return (
                         <TableRow key={aff.id}>
                             <TableCell>
                                 <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={professional.profileImage} />
                                    <AvatarFallback>{professional.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{professional.name}</p>
                                    <p className="text-sm text-muted-foreground">{professional.profileSetupData?.specialty}</p>
                                  </div>
                                </div>
                             </TableCell>
                             <TableCell>{new Date(aff.updatedAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Revocar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Revocar Afiliación?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción desvinculará al profesional de tu empresa y eliminará la verificación. ¿Estás seguro?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => revokeAffiliation(aff.id)}>
                                        Sí, revocar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                         </TableRow>
                     )
                })
              ) : (
                 <TableRow><TableCell colSpan={3} className="text-center">Aún no tienes profesionales afiliados.</TableCell></TableRow>
              )}
            </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
