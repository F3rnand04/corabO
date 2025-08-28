
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCorabo } from '@/contexts/CoraboContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Unsubscribe, doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Notification, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function CashierRequestsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold">Solicitudes de Caja</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

export default function CashierRequestsPage() {
    const { currentUser, users } = useCorabo();
    const [requests, setRequests] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "notifications"), where("userId", "==", currentUser.id), where("type", "==", "cashier_request"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => doc.data() as Notification);
            setRequests(reqs);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [currentUser]);

    const handleRequest = async (requestId: string, approved: boolean) => {
        const requestRef = doc(db, "notifications", requestId);
        const requestSnap = await getDoc(requestRef);
        if (requestSnap.exists()) {
            const requestData = requestSnap.data();
            const sessionRef = doc(db, "qr_sessions", requestData.metadata.requestId);
            
            await updateDoc(sessionRef, { status: approved ? 'pendingAmount' : 'cancelled' });
            await updateDoc(requestRef, { metadata: { ...requestData.metadata, handled: true } });
        }
    };
    
    const unhandledRequests = requests.filter(r => !r.metadata?.handled);

    return (
        <div className="bg-muted/30 min-h-screen">
            <CashierRequestsHeader />
            <main className="container py-8 max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Solicitudes de Apertura de Turno</CardTitle>
                        <CardDescription>Aprueba o rechaza las solicitudes de tus cajeros para que puedan empezar a procesar pagos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cajero</TableHead>
                                    <TableHead>Caja</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                                ) : unhandledRequests.length > 0 ? (
                                    unhandledRequests.map(req => {
                                        const cashierName = req.message.split(' ')[0];
                                        const boxName = req.message.match(/en la caja '([^']*)'/)?.[1];
                                        return (
                                            <TableRow key={req.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                          <AvatarFallback>{cashierName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <p className="font-medium">{cashierName}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{boxName}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="outline" size="icon" className="text-green-500" onClick={() => handleRequest(req.id, true)}><Check className="w-4 h-4" /></Button>
                                                    <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleRequest(req.id, false)}><X className="w-4 h-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No hay solicitudes pendientes.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    