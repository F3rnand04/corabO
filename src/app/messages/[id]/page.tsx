
'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Send, Paperclip, CheckCheck, MapPin, Calendar, FileText, PlusCircle, Handshake, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Message, User, AgreementProposal } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BusinessHoursStatus } from '@/components/BusinessHoursStatus';
import { Separator } from '@/components/ui/separator';
import { ProposalDialog } from '@/components/ProposalDialog';


function ChatHeader({ 
    participant, 
    onDateSelect
}: { 
    participant: User, 
    onDateSelect: (date: Date) => void
}) {
  const router = useRouter();
  const [businessStatus, setBusinessStatus] = useState<'open' | 'closed'>('closed');


  const disabledDays = Object.entries(participant.profileSetupData?.schedule || {})
    .filter(([, dayDetails]) => !dayDetails.active)
    .map(([dayName]) => {
        // Map day name to day of the week index (0=Sunday, 6=Saturday)
        const dayMap: { [key: string]: number } = {
            'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
            'Jueves': 4, 'Viernes': 5, 'Sábado': 6
        };
        return dayMap[dayName];
    });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={participant.profileImage} alt={participant.name} />
          <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{participant.name}</h2>
      </div>
      <div className="flex items-center gap-1">
        <Button 
            variant="ghost" 
            size="icon" 
            disabled={!participant.profileSetupData?.hasPhysicalLocation}
            onClick={() => router.push('/map')}
        >
            <MapPin className={cn("h-5 w-5", participant.isGpsActive && participant.profileSetupData?.hasPhysicalLocation ? "text-green-500" : "text-muted-foreground")} />
        </Button>
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Calendar className={cn("h-5 w-5", {
                        "text-green-500": businessStatus === 'open',
                        "text-red-500": businessStatus === 'closed'
                    })} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="p-3 flex items-center justify-between">
                    <BusinessHoursStatus schedule={participant.profileSetupData?.schedule} onStatusChange={setBusinessStatus} />
                </div>
                <Separator />
                <CalendarComponent
                    mode="single"
                    onSelect={(date) => {
                        if (date) onDateSelect(date);
                    }}
                    disabled={[
                        { dayOfWeek: disabledDays },
                        { before: new Date() }
                    ]}
                    initialFocus
                />
                <div className="p-2 border-t text-center text-xs text-muted-foreground">
                    Días no laborales desactivados.
                </div>
            </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

function ProposalBubble({ msg, onAccept }: { msg: Message, onAccept: (messageId: string) => void }) {
    if (!msg.proposal) return null;
    const { currentUser } = useCorabo();
    const isClient = currentUser.type === 'client';
    const isAccepted = msg.isProposalAccepted;

    return (
        <div className="flex justify-center w-full my-2">
            <div className="w-full max-w-sm rounded-lg border bg-background shadow-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Handshake className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-lg">{msg.proposal.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{msg.proposal.description}</p>
                <Separator />
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-semibold">{format(new Date(msg.proposal.deliveryDate), "dd/MM/yyyy 'a las' HH:mm")}</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo:</span>
                    <span className="font-bold text-lg">${msg.proposal.amount.toFixed(2)}</span>
                </div>
                 {msg.proposal.acceptsCredicora && (
                     <div className="flex items-center gap-2 text-blue-600">
                        <Star className="w-4 h-4 fill-current"/>
                        <span className="text-sm font-semibold">Acepta Credicora</span>
                     </div>
                 )}
                 <div className="pt-2">
                    {isClient && !isAccepted && (
                        <Button className="w-full" onClick={() => onAccept(msg.id)}>Revisar y Aceptar</Button>
                    )}
                    {isAccepted && (
                        <div className="text-center font-semibold text-green-600 p-2 bg-green-50 border border-green-200 rounded-md">
                            Acuerdo Aceptado
                        </div>
                    )}
                     {!isClient && !isAccepted && (
                         <div className="text-center font-semibold text-yellow-600 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            Propuesta Enviada - Esperando Cliente
                        </div>
                     )}
                 </div>
            </div>
        </div>
    )
}

function MessageBubble({ msg, isCurrentUser, onAccept }: { msg: Message, isCurrentUser: boolean, onAccept: (messageId: string) => void }) {
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        // Format time on the client to avoid hydration mismatch
        setFormattedTime(format(new Date(msg.timestamp), 'HH:mm'));
    }, [msg.timestamp]);

    if (msg.type === 'proposal') {
        return <ProposalBubble msg={msg} onAccept={onAccept} />;
    }

    return (
        <div
            className={cn(
                "flex items-end gap-2 max-w-[85%] w-fit",
                isCurrentUser ? "ml-auto" : "mr-auto"
            )}
        >
            <div
                className={cn(
                    "p-2 rounded-lg shadow-md",
                    isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-background rounded-bl-none"
                )}
            >
                <p className="text-sm pr-8">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 h-4">
                    <p className={cn("text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                        {formattedTime || '...'}
                    </p>
                    {isCurrentUser && (
                        <CheckCheck className="w-4 h-4 text-blue-400" />
                    )}
                </div>
            </div>
        </div>
    );
}


export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { conversations, users, currentUser, sendMessage, createAppointmentRequest, acceptProposal } = useCorabo();
  const [newMessage, setNewMessage] = useState('');
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const conversationId = params.id as string;
  const conversation = conversations.find(c => c.id === conversationId);
  const isProvider = currentUser.type === 'provider';

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

  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
    const messageText = `¡Hola! Me gustaría solicitar una cita para el ${formattedDate}. ¿Estás disponible?`;
    sendMessage(conversationId, messageText);
    
    // Simulate provider accepting and creating the commitment
    setTimeout(() => {
        const appointmentMessage = `¡Claro! Te enviaré una propuesta formal para que la aceptes y creemos el compromiso.`;
        sendMessage(conversationId, appointmentMessage);
    }, 1500)
  }

  return (
    <>
    <div className="flex flex-col h-screen bg-muted/30">
      <ChatHeader 
        participant={otherParticipant} 
        onDateSelect={handleDateSelect}
      />
      
      <div className="flex-grow bg-[url('/doodle-bg.png')] bg-repeat">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-2">
            {conversation.messages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUser.id;
              return (
                <MessageBubble key={msg.id} msg={msg} isCurrentUser={isCurrentUser} onAccept={acceptProposal.bind(null, conversationId)} />
              )
            })}
          </div>
        </ScrollArea>
      </div>
      
      <footer className="p-2 border-t bg-transparent">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="bg-background rounded-full shadow-md">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            {isProvider && (
              <Button type="button" variant="ghost" size="icon" className="bg-background rounded-full shadow-md" onClick={() => setIsProposalDialogOpen(true)}>
                  <PlusCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
          <Input
            placeholder="Escribe un mensaje..."
            className="flex-grow rounded-full shadow-md"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" size="icon" className="rounded-full shadow-md">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
    <ProposalDialog 
        isOpen={isProposalDialogOpen} 
        onOpenChange={setIsProposalDialogOpen} 
        conversationId={conversationId}
    />
    </>
  );
}
