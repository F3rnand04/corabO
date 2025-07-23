"use client";

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, List, Home, PlayCircle, MessageSquare, Settings, Bell, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const TransactionItem = ({ status, color, amount }: { status: string; color: string; amount: string }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <p className="font-bold">Multimax</p>
            <p className="text-xs text-gray-400">Tv.32"</p>
            <p className="text-xs text-gray-400">Monto: 105,00</p>
            <p className="text-xs text-gray-400">Pagado: 60,00</p>
            <p className="text-xs text-gray-400">Próximo pago: 21/05/2025</p>
            <Link href="#" className="text-xs text-cyan-400 hover:underline">Más detalles</Link>
        </div>
        <div className="text-right">
            <p className="font-bold text-lg">{amount}</p>
            <p className="text-xs text-gray-400">Monto</p>
            <Button size="sm" className={`mt-2 rounded-full h-8 ${color === 'red' ? 'bg-red-500' : 'bg-green-500'} hover:bg-opacity-80`}>
                Abonar
            </Button>
        </div>
    </div>
);


export default function TransactionsPage() {
    const { currentUser } = useCorabo();

    const fundsData = [
        { label: "Retenido", value: "00,00" },
        { label: "CrediCora", value: "000,00" },
        { label: "Pago pendiente", value: "00,00" },
        { label: "Por Liberar", value: "00,00" },
    ];
    
    return (
        <div className="flex flex-col h-screen justify-between">
            <main className="flex-grow overflow-y-auto pb-24">
                <header className="p-4 space-y-3 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/">
                                <ChevronLeft className="h-6 w-6" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2">
                           <Button variant="ghost" size="icon"><Calendar className="w-5 h-5" /></Button>
                           <Button variant="ghost" size="icon" className="relative">
                               <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-800"></div>
                               <p className="font-bold text-lg">C</p>
                           </Button>
                           <Button variant="ghost" size="icon"><List className="w-5 h-5" /></Button>
                           <Button variant="ghost" size="icon"><MapPin className="w-5 h-5" /></Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-cyan-400">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-lg">{currentUser.name}</p>
                            <p className="text-xs text-gray-400">Especialidad</p>
                            <p className="text-xs text-gray-400">* 0.0 | 00.0% Efectividad</p>
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-500">Informe de act: +00.00 (0.00) 00%</p>
                </header>
                
                <div className="p-4 space-y-4">
                    <Card className="bg-gray-900/70 border-gray-700 rounded-2xl">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <Button variant="link" className="text-white p-0 h-auto">Retirar</Button>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400">Fondos:</p>
                                    <p className="text-2xl font-bold tracking-wider">
                                        <span className="text-cyan-400 font-mono">C</span> 00,00
                                    </p>
                                    <p className="text-xs text-gray-400">Billetera Alpha</p>
                                </div>
                                <Button variant="link" className="text-white p-0 h-auto">Recargar</Button>
                            </div>
                            
                            <Separator className="bg-gray-700" />
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                                {fundsData.map(item => (
                                    <div key={item.label} className="flex justify-between items-baseline">
                                        <p className="text-sm text-gray-300">{item.label}:</p>
                                        <p className="font-mono font-bold text-lg">
                                            <span className="text-cyan-400">C</span> {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-end mt-4">
                               <p className="text-sm font-semibold">Resumen de Transacciones</p>
                               <div className="text-center">
                                   <div className="relative">
                                       <Calendar className="w-8 h-8 mx-auto" />
                                       <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-xs mt-0.5">12</span>
                                       <Bell className="w-3 h-3 absolute top-0 right-0 text-red-500" />
                                   </div>
                                   <p className="text-xs font-bold mt-1">Nivel 1</p>
                               </div>
                           </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/70 border-gray-700 rounded-2xl">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs bg-gray-700 px-2 py-1 rounded-md">Promoción de Hoy</p>
                                <div className="flex items-center gap-2">
                                     <p className="text-sm font-semibold">Destacar esta imagen</p>
                                     <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">2</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-gray-800">
                                <div className="text-center mb-2">
                                    <p className="text-lg font-bold text-green-400">Credicora</p>
                                    <p className="text-xs text-gray-400">Términos y condiciones</p>
                                </div>
                                <TransactionItem status="En uso" color="green" amount="00,00" />
                                <Separator className="bg-gray-700"/>
                                <TransactionItem status="En uso" color="red" amount="00,00" />
                                <Separator className="bg-gray-700"/>
                                <TransactionItem status="En uso" color="green" amount="00,00" />
                                <Separator className="bg-gray-700"/>
                                <TransactionItem status="En uso" color="green" amount="00,00" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

             <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 fixed bottom-0 left-0 right-0 z-20">
              <div className="container flex justify-around h-16 items-center px-2">
                <Button variant="ghost" className="flex-col h-auto p-1 text-gray-400 hover:text-white">
                  <Home className="h-6 w-6" />
                  <span className="text-xs">Home</span>
                </Button>
                <Button variant="ghost" className="flex-col h-auto p-1 text-gray-400 hover:text-white">
                  <PlayCircle className="h-6 w-6" />
                   <span className="text-xs">Como se Hace</span>
                </Button>
                <Button variant="ghost" className="flex-col h-auto p-1 text-gray-400 hover:text-white">
                  <MessageSquare className="h-6 w-6" />
                   <span className="text-xs">Mensajeria</span>
                </Button>
                <Button variant="ghost" className="flex-col h-auto p-1 text-gray-400 hover:text-white">
                    <Settings className="h-6 w-6" />
                    <span className="text-xs">Ajustes</span>
                </Button>
              </div>
            </footer>
        </div>
    );
}
