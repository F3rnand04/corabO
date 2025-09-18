
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Bell, FileText, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getNotifications, markNotificationsAsRead } from '@/lib/actions/notification.actions';
import { Card, CardContent } from '@/components/ui/card';
import type { Notification } from '@/lib/types';


const iconMap: Record<string, React.ElementType> = {
  new_campaign: Bell,
  payment_reminder: Bell,
  admin_alert: Bell,
  welcome: Bell,
  affiliation_request: Bell,
  payment_warning: Bell,
  payment_due: Bell,
  new_publication: Bell,
  cashier_request: Bell,
  new_quote_request: Bell,
  monthly_invoice: FileText,
  tutorial_request: Bell,
  tutorial_payment_request: Bell,
  live_access_request: Bell,
};

function NotificationsHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notificaciones
          </h1>
          <div className="w-8"></div>
        </div>
      </div>
    </header>
  );
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisibleDocId, setLastVisibleDocId] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchNotifications = useCallback(async (startAfter?: string) => {
    if (!currentUser || (!hasMore && startAfter)) return;
    setIsLoading(true);
    try {
        const result = await getNotifications(currentUser.id, 20, startAfter);
        setNotifications(prev => startAfter ? [...prev, ...result.notifications] : result.notifications);
        setLastVisibleDocId(result.lastVisibleDocId);
        setHasMore(!!result.lastVisibleDocId);
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, hasMore]);

  useEffect(() => {
    if (currentUser) {
        markNotificationsAsRead(currentUser.id);
        fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

  const lastElementRef = useCallback((node: any) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchNotifications(lastVisibleDocId);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, lastVisibleDocId, fetchNotifications]);


  return (
    <div className="bg-muted/30 min-h-screen">
      <NotificationsHeader />
      <main className="container max-w-4xl mx-auto py-8">
        <div className="space-y-3">
          {isLoading && notifications.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : notifications.length > 0 ? (
            notifications.map((notif, index) => {
              const Icon = iconMap[notif.type] || Bell;
              const isInvoice = notif.type === 'monthly_invoice';
              const isLastElement = index === notifications.length - 1;
              return (
                <div ref={isLastElement ? lastElementRef : null} key={notif.id}>
                    <Link href={notif.link || '#'} passHref>
                    <Card className={cn("hover:bg-muted/50 transition-colors cursor-pointer", !notif.isRead && "bg-primary/5 border-primary/20")}>
                        <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", !notif.isRead ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Icon className="w-5 h-5"/>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold">{notif.title}</p>
                            <p className="text-sm text-muted-foreground">{notif.message}</p>
                            {isInvoice && notif.metadata?.invoiceDetails && (
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                                    <span>Subtotal: <strong>${notif.metadata.invoiceDetails.subtotal.toFixed(2)}</strong></span>
                                    <span>IVA: <strong>${notif.metadata.invoiceDetails.iva.toFixed(2)}</strong></span>
                                    <span>Total: <strong className="text-foreground">${notif.metadata.invoiceDetails.total.toFixed(2)}</strong></span>
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right shrink-0">
                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: es })}
                        </div>
                        </CardContent>
                    </Card>
                    </Link>
                </div>
              )
            })
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Bell className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No tienes notificaciones nuevas.</p>
            </div>
          )}
          {isLoading && notifications.length > 0 && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin"/></div>}
        </div>
      </main>
    </div>
  );
}
