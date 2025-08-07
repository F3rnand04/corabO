
'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export function UserManagementTab() {
  const { users, toggleUserPause } = useCorabo();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
      u.role !== 'admin' &&
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>Activa o desactiva usuarios en la plataforma. Los usuarios desactivados no aparecerán en búsquedas ni podrán interactuar.</CardDescription>
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
                <TableHead className="text-right">Acción</TableHead>
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
                        <TableCell className="text-right">
                           <Switch
                                checked={!user.isPaused}
                                onCheckedChange={() => toggleUserPause(user.id, !!user.isPaused)}
                           />
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
