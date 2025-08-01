
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function ChatHeader({ name, profileImage }: { name: string, profileImage: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={profileImage} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{name}</h2>
      </div>
    </header>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { conversations, users, currentUser, sendMessage } = useCorabo();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const conversationId = params.id as string;
  const conversation = conversations.find(c => c.id === conversationId);

  const otherParticipantId = conversation?.participantIds.find(pId => pId !== currentUser.id);
  const otherParticipant = users.find(u => u.id === otherParticipantId);
  
  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
        const scrollableViewport = scrollAreaRef.current.children[1] as HTMLElement;
        if(scrollableViewport) {
             scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
        }
    }
  }, [conversation?.messages]);

  if (!conversation || !otherParticipant) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <p>Conversación no encontrada.</p>
        <Button onClick={() => router.push('/messages')} className="mt-4">Volver a Mensajes</Button>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(conversationId, newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      <ChatHeader name={otherParticipant.name} profileImage={otherParticipant.profileImage} />
      
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {conversation.messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex items-end gap-2 max-w-[80%]",
                msg.senderId === currentUser.id ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={msg.senderId === currentUser.id ? currentUser.profileImage : otherParticipant.profileImage} />
                <AvatarFallback>{msg.senderId === currentUser.id ? currentUser.name.charAt(0) : otherParticipant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "p-3 rounded-2xl",
                  msg.senderId === currentUser.id
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background rounded-bl-none"
                )}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <footer className="p-2 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
           <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
          <Input
            placeholder="Escribe un mensaje..."
            className="flex-grow rounded-full"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" size="icon" className="rounded-full">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
