'use client';

import { useMemo } from 'react';
import { Separator } from './ui/separator';
import { Star, TrendingUp, Clock, Gem } from 'lucide-react';
import type { User, Transaction } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-provider';
import { differenceInMilliseconds } from 'date-fns';

function formatPaymentTime(ms: number): string {
    if (ms <= 0) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
}

const getUserMetrics = (userId: string, userType: User['type'], allTransactions: Transaction[]) => {
    const relevantTransactions = allTransactions.filter(tx => (tx.clientId === userId || tx.providerId === userId) && ['Pagado', 'Resuelto'].includes(tx.status));
    const ratedTransactions = relevantTransactions.filter(tx => userType === 'provider' ? tx.details.clientRating : tx.details.providerRating);
    const totalRating = ratedTransactions.reduce((acc, tx) => acc + (userType === 'provider' ? tx.details.clientRating! : tx.details.providerRating!), 0);
    const reputation = ratedTransactions.length > 0 ? totalRating / ratedTransactions.length : 5.0;

    const totalDeals = allTransactions.filter(tx => (tx.clientId === userId || tx.providerId === userId) && tx.type !== 'Sistema').length;
    const effectiveness = totalDeals > 0 ? (relevantTransactions.length / totalDeals) * 100 : 100;
    
    const paymentConfirmations = allTransactions.filter(tx => tx.providerId === userId && tx.details.paymentSentAt && tx.details.paymentConfirmationDate).map(tx => differenceInMilliseconds(new Date(tx.details.paymentConfirmationDate!), new Date(tx.details.paymentSentAt!)));
    const averagePaymentTimeMs = paymentConfirmations.length > 0 ? paymentConfirmations.reduce((a, b) => a + b, 0) / paymentConfirmations.length : 0;
    
    return { 
      reputation: isNaN(reputation) ? 5 : reputation, 
      effectiveness: isNaN(effectiveness) ? 100 : Math.min(effectiveness, 100), 
      averagePaymentTimeMs 
    };
};


export function ProfileStats({ user, isSelf }: { user: User, isSelf: boolean }) {
    const { transactions } = useAuth();
    
    const metrics = useMemo(() => {
        return getUserMetrics(user.id, user.type, transactions);
    }, [user.id, user.type, transactions]);
    
    const effectivenessLabel = user.type === 'provider' ? 'Efectividad' : 'Cumplimiento';
  
    return (
        <div className="flex items-center justify-between w-full text-xs mt-1">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                    <span className="font-semibold text-foreground">{metrics.reputation.toFixed(1)}</span>
                </div>
                <Separator orientation="vertical" className="h-3" />
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500"/>
                    <span className="font-semibold text-foreground">{metrics.effectiveness.toFixed(0)}%</span>
                    <span className="hidden sm:inline-block">{effectivenessLabel}</span>
                </div>
                 <Separator orientation="vertical" className="h-3" />
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500"/>
                    <span className="font-semibold text-foreground">{formatPaymentTime(metrics.averagePaymentTimeMs)}</span>
                    <span className="hidden sm:inline-block">T. Pago</span>
                </div>
            </div>
            {isSelf && (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Gem className="w-4 h-4 text-pink-500"/>
                    <span className="font-semibold text-foreground">{user.giftCredits || 0}</span>
                </div>
            )}
        </div>
    );
}
