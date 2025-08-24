

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Box, ChevronLeft, Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import type { User, CashierBox } from '@/lib/types';


export function CashierLogin() {
    const router = useRouter();
    const { users } = useCorabo();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const [businessId, setBusinessId] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState<User | null>(null);
    const [availableBoxes, setAvailableBoxes] = useState<CashierBox[]>([]);
    
    const [cashierName, setCashierName] = useState('');
    const [cashierBoxId, setCashierBoxId] = useState('');
    const [password, setPassword] = useState('');
    
    useEffect(() => {
        if(businessId) {
            const foundBusiness = users.find(u => u.coraboId === businessId.trim() && u.type === 'provider' && u.profileSetupData?.providerType === 'company');
            setSelectedBusiness(foundBusiness || null);
            setAvailableBoxes(foundBusiness?.profileSetupData?.cashierBoxes || []);
            setCashierBoxId(''); // Reset selection when business changes
        } else {
            setSelectedBusiness(null);
            setAvailableBoxes([]);
        }
    }, [businessId, users]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // This functionality is temporarily disabled for simplification.
        toast({
            variant: "destructive",
            title: "Función Desactivada",
            description: "El inicio de sesión de cajero está temporalmente desactivado.",
        });
        setIsLoading(false);
    };

    const canSubmit = selectedBusiness && cashierName && cashierBoxId && password;

    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
             <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.push('/login')}>
                <ChevronLeft className="h-6 w-6"/>
            </Button>
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Box className="w-8 h-8"/>
                    </div>
                    <CardTitle>Acceso de Caja</CardTitle>
                    <CardDescription>
                        Introduce los datos del negocio y tu caja asignada para solicitar el inicio de turno.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="business-id">ID CorabO del Negocio</Label>
                            <Input id="business-id" placeholder="Ej: corabo1234" value={businessId} onChange={e => setBusinessId(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="cashier-name">Tu Nombre (Cajero)</Label>
                            <Input id="cashier-name" placeholder="Ej: Juan Pérez" value={cashierName} onChange={e => setCashierName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cashier-box">Caja Asignada</Label>
                            <Select onValueChange={setCashierBoxId} value={cashierBoxId} disabled={!selectedBusiness}>
                                <SelectTrigger id="cashier-box">
                                    <SelectValue placeholder={selectedBusiness ? "Selecciona una caja" : "Introduce un ID de negocio"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableBoxes.map(box => (
                                      <SelectItem key={box.id} value={box.id}>{box.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="password">Contraseña de la Caja</Label>
                            <Input id="password" type="password" placeholder="••••" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={!canSubmit || isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4"/>}
                            Solicitar Apertura
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
