
"use client";

import { useState, useMemo } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Menu, Home, Plus, Settings, ChevronDown, CheckCircle, AlertTriangle, ShieldAlert, MessageSquare, Handshake } from 'lucide-react';
import type { Transaction, TransactionStatus } from '@/lib/types';
import TransactionsChart from '@/components/charts/TransactionsChart';

// Mock data for demonstration purposes
const totalBalance = 267345;
const income = 34345;
const outcome = 17345;

const statusIcons: Record<TransactionStatus, React.ElementType> = {
    'Pagado': CheckCircle,
    'Resuelto': CheckCircle,
    'Carrito Activo': AlertTriangle,
    'Pre-factura Pendiente': AlertTriangle,
    'Solicitud Pendiente': MessageSquare,
    'Cotización Recibida': MessageSquare,
    'Acuerdo Aceptado - Pendiente de Ejecución': Handshake,
    'Servicio en Curso': Handshake,
    'En Disputa': ShieldAlert,
};

const statusColors: Record<TransactionStatus, string> = {
    'Pagado': 'text-green-500',
    'Resuelto': 'text-green-500',
    'Carrito Activo': 'text-gray-500',
    'Pre-factura Pendiente': 'text-gray-500',
    'Solicitud Pendiente': 'text-yellow-500',
    'Cotización Recibida': 'text-blue-500',
    'Acuerdo Aceptado - Pendiente de Ejecución': 'text-emerald-500',
    'Servicio en Curso': 'text-emerald-500',
    'En Disputa': 'text-red-500',
};

export default function TransactionsPage() {
  const { transactions, currentUser } = useCorabo();

  const userTransactions = useMemo(() => transactions
    .filter(tx => tx.clientId === currentUser.id || tx.providerId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, currentUser.id]
  );

  return (
    <div className="flex flex-col h-screen justify-between">
      <header className="px-4 pt-6 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-cyan-400">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{currentUser.name}</p>
              <p className="text-xs text-slate-500">Bienvenido</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6 text-slate-600" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-white rounded-t-3xl shadow-2xl shadow-slate-200/80 px-4 py-6 space-y-6">
        {/* Balance Section */}
        <div className="text-center">
          <p className="text-sm text-slate-500">Balance Total</p>
          <p className="text-4xl font-bold text-slate-800 tracking-tight">${totalBalance.toLocaleString()}</p>
        </div>

        {/* Income & Outcome */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-50 border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <ArrowUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">${income.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Ingresos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-full">
                <ArrowDown className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">${outcome.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Egresos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <div>
            <div className="h-[200px] -mx-4">
                <TransactionsChart transactions={userTransactions} />
            </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Transacciones</h2>
            <Button variant="ghost" size="sm" className="text-slate-500">
              Ver todo <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {userTransactions.slice(0, 4).map((tx) => {
            const isIncome = tx.providerId === currentUser.id;
            const Icon = statusIcons[tx.status] || AlertTriangle;
            const color = statusColors[tx.status] || 'text-gray-500';

            return (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-white rounded-full shadow-sm`}>
                         <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-slate-700">{tx.type === 'Compra' ? `Compra de ${tx.details.items?.length || 0} items` : `Servicio: ${tx.details.serviceName}`}</p>
                        <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
                <p className={`font-bold text-sm ${isIncome ? 'text-emerald-500' : 'text-slate-800'}`}>
                    {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
              </div>
            )
          })}
        </div>
      </main>

      <footer className="bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-20">
          <Button variant="ghost" size="icon" className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600">
            <Plus className="h-8 w-8" />
          </Button>
          <Button variant="ghost" size="icon" className="w-16 h-16 rounded-2xl bg-cyan-400 text-white shadow-lg shadow-cyan-200">
            <Home className="h-8 w-8" />
          </Button>
          <Button variant="ghost" size="icon" className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600">
            <Settings className="h-8 w-8" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
