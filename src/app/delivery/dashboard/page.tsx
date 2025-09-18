
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Truck, Check, History, Navigation, Phone, MapPin, DollarSign, LogOut, ChevronLeft } from 'lucide-react';
import { getDeliveryJobs, acceptDeliveryJob, completeDelivery } from '@/lib/actions/delivery.actions';
import { toggleGps } from '@/lib/actions/user.actions';
import type { Transaction, User } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

function DeliveryDashboardHeader() {
    const { currentUser, logout } = useAuth();
    const router = useRouter();

    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Truck className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold">Panel de Repartidor</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold hidden sm:inline">{currentUser?.name}</p>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={currentUser?.profileImage} />
                            <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="icon" onClick={logout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}

function JobCard({ job, onAccept, onComplete, onNavigate, onCall }: { job: Transaction, onAccept: () => void, onComplete: () => void, onNavigate: (lat: number, lon: number) => void, onCall: (phone: string) => void }) {
    const { users } = useAuth();
    const vendor = users.find(u => u.id === job.providerId);
    const clientLocation = job.details.delivery?.address?.split(',').map(Number);
    const vendorLocation = vendor?.profileSetupData?.location?.split(',').map(Number);

    const distance = useMemo(() => {
        if (!vendorLocation || !clientLocation) return null;
        return haversineDistance(vendorLocation[0], vendorLocation[1], clientLocation[0], clientLocation[1]);
    }, [vendorLocation, clientLocation]);
    
    const earnings = job.details.deliveryCost ? job.details.deliveryCost * 0.85 : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Entrega de {vendor?.name}</CardTitle>
                    <span className="font-bold text-lg">${earnings.toFixed(2)}</span>
                </div>
                <CardDescription>Para: {job.details.delivery?.recipientInfo?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Recoger en:</p>
                        <p className="text-muted-foreground">{vendor?.profileSetupData?.location}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Navigation className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Entregar en:</p>
                        <p className="text-muted-foreground">{job.details.delivery?.address}</p>
                    </div>
                </div>
                {distance && <p className="text-xs font-semibold text-center">Distancia Total: {distance.toFixed(1)} km</p>}
            </CardContent>
            <CardFooter className="flex gap-2">
                 {job.status === 'Buscando Repartidor' && (
                    <Button className="w-full" onClick={onAccept}>
                        <Check className="mr-2 h-4 w-4" /> Aceptar Trabajo
                    </Button>
                )}
                 {job.status === 'En Reparto' && (
                    <>
                        <Button variant="outline" className="flex-1" onClick={() => onCall(job.details.delivery?.recipientInfo?.phone || '')}><Phone className="mr-2 h-4 w-4" /> Llamar</Button>
                        <Button variant="outline" className="flex-1" onClick={() => onNavigate(clientLocation![0], clientLocation![1])}><Navigation className="mr-2 h-4 w-4" /> Navegar</Button>
                        <Button className="flex-1" onClick={onComplete}>Completar</Button>
                    </>
                 )}
            </CardFooter>
        </Card>
    );
}

export default function DeliveryDashboardPage() {
    const { currentUser, transactions } = useAuth();
    const [availableJobs, setAvailableJobs] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!currentUser || !currentUser.isGpsActive) {
            setIsLoading(false);
            setAvailableJobs([]);
            return;
        };

        const interval = setInterval(() => {
            getDeliveryJobs(currentUser.id).then(jobs => {
                setAvailableJobs(jobs);
            }).finally(() => setIsLoading(false));
        }, 5000); // Poll for new jobs every 5 seconds

        return () => clearInterval(interval);
    }, [currentUser]);

    const handleAcceptJob = async (jobId: string) => {
        if (!currentUser) return;
        try {
            await acceptDeliveryJob(jobId, currentUser.id);
            toast({ title: '¡Trabajo Aceptado!', description: 'El cliente ha sido notificado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo aceptar el trabajo.' });
        }
    };
    
    const handleCompleteJob = async (jobId: string) => {
        try {
            await completeDelivery(jobId);
            toast({ title: '¡Entrega Completada!', description: 'La transacción ha sido actualizada.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la entrega.' });
        }
    };

    const handleNavigate = (lat: number, lon: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
    };
    
    const handleCall = (phone: string) => {
        window.location.href = `tel:${phone}`;
    };

    const inProgressJobs = useMemo(() => {
        return transactions.filter(tx => tx.status === 'En Reparto' && tx.details.deliveryProviderId === currentUser?.id);
    }, [transactions, currentUser]);

    const completedJobs = useMemo(() => {
        return transactions.filter(tx => tx.providerId === 'corabo-admin' && tx.clientId === currentUser?.id);
    }, [transactions, currentUser]);

    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin" /></div>;
    }

    return (
        <>
            <DeliveryDashboardHeader />
            <main className="container py-8 max-w-4xl mx-auto space-y-8 pb-24">
                <Card>
                    <CardHeader>
                        <CardTitle>Estado del Repartidor</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <Label htmlFor="availability-switch" className="font-semibold">Disponible para recibir trabajos</Label>
                        <Switch id="availability-switch" checked={currentUser.isGpsActive} onCheckedChange={() => toggleGps(currentUser.id)} />
                    </CardContent>
                    {!currentUser.isGpsActive && (
                        <CardFooter>
                            <p className="text-sm text-destructive">Estás desconectado. Actívate para ver y recibir nuevas solicitudes de entrega.</p>
                        </CardFooter>
                    )}
                </Card>

                <Tabs defaultValue="available">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="available">Disponibles</TabsTrigger>
                        <TabsTrigger value="in-progress">En Curso ({inProgressJobs.length})</TabsTrigger>
                        <TabsTrigger value="history">Historial</TabsTrigger>
                    </TabsList>
                    <TabsContent value="available" className="mt-4 space-y-4">
                        {isLoading ? (
                            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                        ) : availableJobs.length > 0 ? (
                            availableJobs.map(job => <JobCard key={job.id} job={job} onAccept={() => handleAcceptJob(job.id)} onComplete={() => {}} onNavigate={handleNavigate} onCall={handleCall} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No hay trabajos disponibles cerca de ti en este momento.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="in-progress" className="mt-4 space-y-4">
                         {inProgressJobs.length > 0 ? (
                            inProgressJobs.map(job => <JobCard key={job.id} job={job} onAccept={() => {}} onComplete={() => handleCompleteJob(job.id)} onNavigate={handleNavigate} onCall={handleCall} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No tienes entregas en curso.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="history" className="mt-4 space-y-2">
                        {completedJobs.map(job => (
                            <Card key={job.id}>
                                <CardContent className="p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">{job.details.system}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(job.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-bold text-green-600">+${job.amount.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            </main>
        </>
    );
}
