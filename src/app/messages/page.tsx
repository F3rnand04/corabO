

'use client';

import { useState, useEffect } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Search, SquarePen, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConversationCard } from '@/components/ConversationCard';
import { ActivationWarning } from '@/components/ActivationWarning';
import { Skeleton } from '@/components/ui/skeleton';


function MessagesHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Mensajes</h1>
          <Button variant="ghost" size="icon">
            <SquarePen className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}


export default function MessagesPage() {
    const { currentUser, conversations } = useCorabo();
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            setIsLoading(false);
        }
    }, [currentUser, conversations]);


    const isClientWithInactiveTransactions = currentUser?.type === 'client' && !currentUser?.isTransactionsActive;
    
    // Sort conversations locally on each render
    const sortedConversations = [...conversations].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    const filteredConversations = sortedConversations.filter(convo => {
        if (!currentUser) return false;
        
        const lowerCaseQuery = searchQuery.toLowerCase().trim();
        if (!lowerCaseQuery) return true;
        
        const lastMessageText = convo.messages[convo.messages.length - 1]?.text || '';
        const messageMatch = lastMessageText.toLowerCase().includes(lowerCaseQuery);
        
        return messageMatch;
    });
    
    const renderContent = () => {
        if (isLoading) {
            return (
                 <div className="space-y-2 px-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                 </div>
            )
        }
        if (filteredConversations.length > 0) {
            return (
                 <div className="space-y-2 px-4 pb-24">
                    {filteredConversations.map(convo => (
                        <ConversationCard key={convo.id} conversation={convo} />
                    ))}
                </div>
            )
        }
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">No tienes conversaciones.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-muted/20">
            <MessagesHeader />
             <div className="container py-4 px-4 space-y-4">
                {isClientWithInactiveTransactions && (
                    <ActivationWarning userType='client' />
                )}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar chat o mensaje..." 
                        className="pl-10 rounded-full bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}
