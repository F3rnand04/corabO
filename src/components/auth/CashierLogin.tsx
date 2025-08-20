
'use client';

import { useState } from 'react';
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

// This is a placeholder for the actual hook that would handle cashier login logic.
// In the real implementation, this would call a Genkit flow.
const useCashierAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const requestSession = async (data: any) => {
        setIsLoading(true);
        console.log("Requesting cashier session with:", data);
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        toast({
            title: "Solicitud Enviada",
            description: "El dueño del negocio ha sido notificado. Por favor, espera su aprobación.",
        });
        // In a real app, we would start listening for approval here.
        // For the prototype, we can just inform the user.
    };

    return { requestSession, isLoading };
};

export function CashierLogin() {
    const router = useRouter();
    const { requestSession, isLoading } = useCashierAuth();
    
    const [businessId, setBusinessId] = useState('');
    const [cashierName, setCashierName] = useState('');
    const [cashierBox, setCashierBox] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestSession({ businessId, cashierName, cashierBox, password });
    };

    const canSubmit = businessId && cashierName && cashierBox && password;

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
                            <Select onValueChange={setCashierBox} value={cashierBox}>
                                <SelectTrigger id="cashier-box">
                                    <SelectValue placeholder="Selecciona una caja" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* This would be populated dynamically in a real app */}
                                    <SelectItem value="caja-1">Caja Principal</SelectItem>
                                    <SelectItem value="caja-2">Barra</SelectItem>
                                    <SelectItem value="caja-3">Auto-servicio</SelectItem>
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

    