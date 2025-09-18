'use client';

import { Separator } from './ui/separator';
import { Star, TrendingUp, Clock, Gem } from 'lucide-react';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

function formatPaymentTime(ms: number): string {
    if (ms <= 0) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
}

export function ProfileStats({ user, isSelf }: { user: User, isSelf: boolean }) {
    const { getUserMetrics, transactions } = useAuth();
    const metrics = getUserMetrics(user.id, user.type, transactions);
    
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
