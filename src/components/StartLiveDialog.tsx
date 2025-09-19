

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-provider';
import { useToast } from '@/hooks/use-toast';
import { startLiveStream } from '@/lib/actions/livestream.actions';

interface StartLiveDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function StartLiveDialog({ isOpen, onOpenChange }: StartLiveDialogProps) {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [accessCost, setAccessCost] = useState<number | undefined>();
    const [isLoading, setIsLoading] = useState(false);

    const handleStartLive = async () => {
        if (!title || (isPrivate && !accessCost)) {
            toast({ variant: 'destructive', title: 'Faltan datos', description: 'Por favor, completa todos los campos requeridos.' });
            return;
        }
        if (!currentUser) return;

        setIsLoading(true);
        try {
            const liveStream = await startLiveStream({
                creatorId: currentUser.id,
                title,
                description,
                visibility: isPrivate ? 'private' : 'public',
                accessCostCredits: isPrivate ? accessCost : undefined,
            });
            toast({ title: '¡Directo Iniciado!', description: 'Tu transmisión en vivo ha comenzado.' });
            onOpenChange(false);
            // Future: redirect to the live stream page: router.push(`/live/${liveStream.id}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Iniciar Transmisión en Vivo</DialogTitle>
                    <DialogDescription>
                        Configura los detalles de tu transmisión.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Clase de Cocina, Sesión de Q&A" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe de qué tratará tu directo..." />
                    </div>
                    
                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="is-private" className="font-medium">
                                Transmisión Privada
                                <span className="block text-xs text-muted-foreground">Solo usuarios aprobados podrán entrar.</span>
                            </Label>
                            <Switch id="is-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
                        </div>
                        {isPrivate && (
                            <div className="space-y-2 pt-3 border-t">
                                <Label htmlFor="access-cost">Costo de Acceso (en Créditos)</Label>
                                <Input id="access-cost" type="number" value={accessCost || ''} onChange={(e) => setAccessCost(Number(e.target.value))} placeholder="Ej: 100" />
                                <p className="text-xs text-muted-foreground mt-2">El espectador deberá enviar un regalo con este valor en créditos para unirse.</p>
                            </div>
                        )}
                    </div>
                    
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Política de Contenido</AlertTitle>
                        <AlertDescription>
                            El contenido sexual o explícito está terminantemente prohibido. El incumplimiento resultará en la suspensión permanente de la cuenta.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleStartLive} disabled={isLoading || !title || (isPrivate && !accessCost)}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Iniciar Transmisión
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
