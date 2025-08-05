

"use client";

import type { Transaction, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useCorabo } from "@/contexts/CoraboContext";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Handshake, MessageSquare, Send, ShieldAlert, ClipboardCheck, Banknote } from "lucide-react";

interface TransactionListProps {
  title: string;
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

const statusInfo: { [key: string]: { icon: React.ElementType, color: string, label: string } } = {
    'Solicitud Pendiente': { icon: MessageSquare, color: 'text-yellow-500', label: 'Pendiente' },
    'Cotización Recibida': { icon: Send, color: 'text-blue-500', label: 'Cotizado' },
    'Acuerdo Aceptado - Pendiente de Ejecución': { icon: Handshake, color: 'text-cyan-500', label: 'Acordado' },
    'Servicio en Curso': { icon: Handshake, color: 'text-blue-500', label: 'En Curso' },
    'En Disputa': { icon: ShieldAlert, color: 'text-red-500', label: 'Disputa' },
    'Pagado': { icon: CheckCircle, color: 'text-green-500', label: 'Pagado' },
    'Resuelto': { icon: CheckCircle, color: 'text-green-500', label: 'Resuelto' },
    'Carrito Activo': { icon: AlertTriangle, color: 'text-gray-500', label: 'En Carrito' },
    'Pre-factura Pendiente': { icon: AlertTriangle, color: 'text-gray-500', label: 'Pre-factura' },
    'Finalizado - Pendiente de Pago': { icon: ClipboardCheck, color: 'text-orange-500', label: 'Por Pagar' },
    'Pendiente de Confirmación del Cliente': { icon: ClipboardCheck, color: 'text-yellow-600', label: 'Por Confirmar' },
    'Pago Enviado - Esperando Confirmación': { icon: Banknote, color: 'text-blue-500', label: 'Pago Enviado' },
  };

const TransactionItem = ({ transaction, onClick, otherParty }: { transaction: Transaction, onClick: (transaction: Transaction) => void, otherParty?: User }) => {
    
    const Icon = statusInfo[transaction.status]?.icon || AlertTriangle;
    const iconColor = statusInfo[transaction.status]?.color || 'text-gray-500';

    let description = '';
    let descriptionPrefix = '';

    if (transaction.type === 'Sistema' && transaction.details.system) {
        const quotaMatch = transaction.details.system.match(/Cuota (\d+)\/(\d+)/);
        if (quotaMatch) {
            const current = parseInt(quotaMatch[1], 10);
            const total = parseInt(quotaMatch[2], 10);
            descriptionPrefix = current === total ? 'Última Cuota' : `Cuota ${current}/${total}`;
            description = transaction.details.system.replace(/Cuota \d+\/\d+ de /, '');
        } else {
            description = transaction.details.system;
        }
    } else if (transaction.details.paymentMethod === 'credicora' && transaction.details.initialPayment) {
        descriptionPrefix = 'Inicial de Compra';
        description = transaction.details.serviceName || transaction.details.items?.map(i => i.product.name).join(', ') || '';
    } else {
        description = transaction.type === 'Servicio' 
            ? transaction.details.serviceName
            : transaction.type === 'Compra' 
                ? transaction.details.items?.map(i => `${i.quantity}x ${i.product.name}`).join(', ')
                : 'Transacción del sistema';
    }


    return (
        <div 
            className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg cursor-pointer"
            onClick={() => onClick(transaction)}
        >
            <Avatar className="h-10 w-10">
                <AvatarImage src={otherParty?.profileImage} alt={otherParty?.name} />
                <AvatarFallback>{otherParty?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{otherParty?.name || 'Sistema'}</p>
                    {transaction.details.paymentFromThirdParty && (
                        <Badge variant="destructive" className="h-5 text-xs">!</Badge>
                    )}
                </div>
                 <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {descriptionPrefix && <span className="font-bold text-foreground">{descriptionPrefix}: </span>}
                    {description}
                </p>
            </div>
            <div className="text-right">
                <p className="font-bold text-sm">${transaction.amount.toFixed(2)}</p>
                <div className={cn("flex items-center justify-end gap-1 text-xs font-semibold", iconColor)}>
                    <Icon className="w-3 h-3"/>
                    <span>{statusInfo[transaction.status]?.label || transaction.status}</span>
                </div>
            </div>
        </div>
    );
};

export function TransactionList({ title, transactions, onTransactionClick }: TransactionListProps) {
  const { users, currentUser } = useCorabo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map(tx => {
               const otherPartyId = tx.providerId === currentUser.id ? tx.clientId : tx.providerId;
               const otherParty = users.find(u => u.id === otherPartyId);
               return <TransactionItem key={tx.id} transaction={tx} onClick={onTransactionClick} otherParty={otherParty} />;
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No hay transacciones en esta vista.</p>
        )}
      </CardContent>
    </Card>
  );
}
