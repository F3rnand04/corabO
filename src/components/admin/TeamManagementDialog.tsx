
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/lib/data/options';
import { createManagementUser } from '@/lib/actions/admin.actions';


interface TeamManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const managementRoles = [
    { value: 'payment_verifier', label: 'Verificador de Pagos' },
    { value: 'document_verifier', label: 'Verificador de Documentos' },
    { value: 'dispute_manager', label: 'Gestor de Disputas' },
    { value: 'customer_support', label: 'Atención al Cliente' },
    { value: 'accountant', label: 'Contabilidad' }
];

export function TeamManagementDialog({ isOpen, onOpenChange }: TeamManagementDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<any>('');
    const [country, setCountry] = useState('');

    const resetForm = () => {
        setName('');
        setLastName('');
        setEmail('');
        setIdNumber('');
        setPassword('');
        setRole('');
        setCountry('');
        setIsLoading(false);
    }
    
    const handleCreateUser = async () => {
        if (!name || !lastName || !email || !idNumber || !password || !role || !country) {
            toast({ variant: 'destructive', title: 'Error', description: 'Todos los campos son obligatorios.' });
            return;
        }
        setIsLoading(true);
        try {
            await createManagementUser({ 
                name, 
                lastName, 
                email, 
                idNumber, 
                password, 
                role, 
                country 
            });
            toast({ title: 'Usuario Creado', description: `Se ha creado el usuario de gestión para ${name} ${lastName}.` });
            resetForm();
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al crear usuario', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            onOpenChange(open);
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" width={120} height={40} className="h-10 w-auto" />
                    <DialogTitle>Panel del CEO</DialogTitle>
                    <DialogDescription>
                        Crea nuevos usuarios con roles específicos para gestionar la plataforma.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="idNumber">Cédula de Identidad</Label>
                        <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Select onValueChange={setCountry} value={country}>
                            <SelectTrigger id="country">
                                <SelectValue placeholder="Asignar país de operación..." />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(c => (
                                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Rol de Gestión</Label>
                        <Select onValueChange={setRole} value={role}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Selecciona un rol..." />
                            </SelectTrigger>
                            <SelectContent>
                                {managementRoles.map(r => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleCreateUser} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Usuario de Gestión
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
