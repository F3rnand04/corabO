
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { deleteUser, toggleUserPause } from '@/lib/actions/admin.actions';

export function UserManagementTab() {
  const { users } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
      u.role !== 'admin' &&
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>Activa, desactiva o elimina usuarios de la plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input 
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredUsers.map(user => (
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
                        <TableCell><Badge variant="secondary" className="capitalize">{user.type}</Badge></TableCell>
                        <TableCell>
                            <Badge variant={user.isPaused ? 'destructive' : 'default'}>
                                {user.isPaused ? 'Inactivo' : 'Activo'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                           <Switch
                                checked={!user.isPaused}
                                onCheckedChange={() => toggleUserPause(user.id, !!user.isPaused)}
                           />
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                      <Trash2 className="w-4 h-4"/>
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar a {user.name}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Esta acción es permanente y no se puede deshacer. Se eliminarán todos los datos asociados a este usuario.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteUser(user.id)}>Sí, eliminar usuario</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                           </AlertDialog>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
