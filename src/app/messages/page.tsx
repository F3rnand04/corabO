
'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Search, SquarePen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConversationCard } from '@/components/ConversationCard';
import type { Conversation } from '@/lib/types';
import { ActivationWarning } from '@/components/ActivationWarning';


function MessagesHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
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
    const { conversations, users, currentUser } = useCorabo();
    const [searchQuery, setSearchQuery] = useState('');

    const isClientWithInactiveTransactions = currentUser?.type === 'client' && !currentUser?.isTransactionsActive;

    const filteredConversations = conversations.filter(convo => {
        if (!currentUser) return false;
        const otherParticipantId = convo.participantIds.find(pId => pId !== currentUser.id);
        const otherParticipant = users.find(u => u.id === otherParticipantId);
        if (!otherParticipant) {
             // Handle system conversations
            if (convo.id.includes('corabo-admin')) {
                return 'corabo admin'.includes(searchQuery.toLowerCase());
            }
            return false;
        };

        const lastMessage = convo.messages[convo.messages.length - 1];
        
        const lowerCaseQuery = searchQuery.toLowerCase();

        const nameMatch = otherParticipant.name.toLowerCase().includes(lowerCaseQuery);
        
        const messageMatch = lastMessage?.text ? lastMessage.text.toLowerCase().includes(lowerCaseQuery) : false;

        return nameMatch || messageMatch;
    });

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
                <div className="container space-y-2 px-4 pb-24">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map(convo => (
                            <ConversationCard key={convo.id} conversation={convo} />
                        ))
                    ) : (
                         <div className="text-center py-20">
                            <p className="text-muted-foreground">No se encontraron conversaciones.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
