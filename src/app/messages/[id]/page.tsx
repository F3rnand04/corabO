'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Send, Paperclip, CheckCheck, MapPin, Calendar, FileText, PlusCircle, Handshake, Star, AlertTriangle, Loader2, Link as LinkIcon, Forward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Message, User, AgreementProposal, Conversation } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BusinessHoursStatus } from '@/components/BusinessHoursStatus';
import { Separator } from '@/components/ui/separator';
import { ProposalDialog } from '@/components/ProposalDialog';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { createAppointmentRequest, acceptProposal } from '@/lib/actions/transaction.actions';
import { sendMessage, markConversationAsRead } from '@/lib/actions/messaging.actions';


function ChatHeader({ 
    participant, 
    isSelfChat,
    onDateSelect
}: { 
    participant: User, 
    isSelfChat: boolean,
    onDateSelect: (date: Date) => void
}) {
  const router = useRouter();
  const [businessStatus, setBusinessStatus] = useState<'open' | 'closed'>('closed');


  const disabledDays = Object.entries(participant.profileSetupData?.schedule || {})
    .filter(([, dayDetails]) => !(dayDetails as any).active)
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
        <Link href={`/companies/${participant.id}`} className="flex items-center gap-2 cursor-pointer group">
          <Avatar className="w-10 h-10">
            <AvatarImage src={participant.profileImage} alt={participant.name} />
            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="font-semibold group-hover:underline">{isSelfChat ? 'Tú (Notas)' : participant.name}</h2>
        </Link>
      </div>
      {!isSelfChat && (
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
      )}
    </header>
  );
}

function LocationBubble({ lat, lon, onForward }: { lat: number, lon: number, onForward: () => void }) {
  const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;
  return (
    <div className="flex flex-col items-center w-full my-2">
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-sm rounded-lg border bg-background shadow-md p-0.5 space-y-1 overflow-hidden group">
        <div className="relative aspect-video w-full">
           <Image
              src={`https://placehold.co/400x200.png?text=Mapa`}
              alt="Mapa de ubicación"
              fill
              style={{objectFit: 'cover'}}
              data-ai-hint="map location"
              className="group-hover:scale-105 transition-transform duration-300"
            />
        </div>
        <div className="p-2 text-center">
            <p className="text-sm font-semibold">Ubicación Compartida</p>
            <p className="text-xs text-blue-600 group-hover:underline">Ver en Google Maps</p>
        </div>
      </a>
      <Button variant="outline" size="sm" className="mt-2" onClick={onForward}>
        <Forward className="w-4 h-4 mr-2" />
        Reenviar Ubicación
      </Button>
    </div>
  );
}


function ProposalBubble({ msg, onAccept, canAccept }: { msg: Message, onAccept: (messageId: string) => void, canAccept: boolean }) {
    if (!msg.proposal) return null;
    const { currentUser } = useCorabo();
    const isClient = currentUser?.type === 'client';
    const isAccepted = msg.isProposalAccepted;
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (msg.proposal?.deliveryDate) {
            setFormattedDate(format(new Date(msg.proposal.deliveryDate), "dd/MM/yyyy 'a las' HH:mm"));
        }
    }, [msg.proposal?.deliveryDate]);

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
                    <span className="font-semibold">{formattedDate || '...'}</span>
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
                        <Button className="w-full" onClick={() => onAccept(msg.id)} disabled={!canAccept}>Revisar y Aceptar</Button>
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

function MessageBubble({ msg, isCurrentUser, onAccept, canAcceptProposal, onForwardLocation }: { msg: Message, isCurrentUser: boolean, onAccept: (messageId: string) => void, canAcceptProposal: boolean, onForwardLocation: (location: { lat: number, lon: number }) => void }) {
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        // Format time on the client to avoid hydration mismatch
        setFormattedTime(format(new Date(msg.timestamp), 'HH:mm'));
    }, [msg.timestamp]);

    if (msg.type === 'proposal') {
        return <ProposalBubble msg={msg} onAccept={onAccept} canAccept={canAcceptProposal} />;
    }

    if (msg.type === 'location' && msg.location) {
        return <LocationBubble lat={msg.location.lat} lon={msg.location.lon} onForward={() => onForwardLocation(msg.location!)} />;
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
                        <CheckCheck className={cn("w-4 h-4", msg.isRead ? "text-blue-400" : "text-primary-foreground/50")} />
                    )}
                </div>
            </div>
        </div>
    );
}


export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, conversations, users, setDeliveryAddressToCurrent, currentUserLocation } = useCorabo();
  const { toast } = useToast();
  
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelfChat, setIsSelfChat] = useState(false);

  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const conversationId = params?.id as string;

  // Get the specific conversation from the global state
  const conversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (!currentUser || !conversation) {
        setIsLoading(conversations.length === 0);
        return;
    }

    const otherId = conversation.participantIds?.find(pId => pId !== currentUser.id);
    
    // Explicitly check for self-chat
    const selfChatDetected = conversation.participantIds?.every(pId => pId === currentUser.id);

    if (selfChatDetected) {
        setIsSelfChat(true);
        setOtherParticipant(currentUser);
        setIsLoading(false);
    } else if (otherId) {
        setIsSelfChat(false);
        if (otherId !== otherParticipant?.id) {
            const participantData = users.find(u => u.id === otherId);
            setOtherParticipant(participantData || null);
            setIsLoading(false);
        } else {
             setIsLoading(false);
        }
    } else {
        // Handle case where participantIds is corrupted but conversation exists
        setIsLoading(false);
        console.error("Conversation is missing a valid other participant.");
    }
    
    markConversationAsRead(conversationId);

  }, [conversationId, currentUser, conversation, otherParticipant?.id, users]);

  
  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
        const scrollableViewport = scrollAreaRef.current.children[1] as HTMLElement;
        if(scrollableViewport) {
             scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
        }
    }
  }, [conversation?.messages]);


  if (isLoading || !currentUser || !otherParticipant || !conversation) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin"/>
      </div>
    );
  }

  const isProvider = currentUser?.type === 'provider';
  const canAcceptProposal = currentUser?.isTransactionsActive ?? false;
  const showProviderWarning = isProvider && !isSelfChat && (!otherParticipant?.isTransactionsActive);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      if(!currentUser) return;
      sendMessage({ recipientId: otherParticipant.id, text: newMessage, conversationId, senderId: currentUser.id });
      setNewMessage('');
    }
  };

  const handleDateSelect = (date: Date) => {
      const formattedDate = format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
      const requestDetails = `Solicitud de cita para el ${formattedDate}.`;
      
      if(!currentUser) return;

      createAppointmentRequest({
          providerId: otherParticipant.id,
          clientId: currentUser.id,
          date: date.toISOString(),
          details: requestDetails,
          amount: otherParticipant.profileSetupData?.appointmentCost || 0,
      });

      sendMessage({ 
          recipientId: otherParticipant.id, 
          text: `¡Hola! Me gustaría solicitar una cita para el ${formattedDate}. ¿Estás disponible?`,
          conversationId,
          senderId: currentUser.id
      });

      toast({
          title: "Solicitud de Cita Enviada",
          description: "El proveedor ha sido notificado. Podrás ver el estado en tu registro de transacciones."
      });
  };
  
  const handleSendLocation = (type: 'current' | 'saved') => {
      if(!currentUser) return;
      if (type === 'current') {
          if (currentUserLocation) {
              sendMessage({
                  recipientId: otherParticipant.id,
                  location: { lat: currentUserLocation.latitude, lon: currentUserLocation.longitude },
                  conversationId,
                  senderId: currentUser.id
              });
          } else {
              toast({ variant: 'destructive', title: 'Ubicación no disponible', description: 'Activa los permisos de GPS para compartir tu ubicación actual.' });
          }
      } else { // 'saved'
          if (currentUser.profileSetupData?.location) {
              const [lat, lon] = currentUser.profileSetupData.location.split(',').map(Number);
              sendMessage({
                  recipientId: otherParticipant.id,
                  location: { lat, lon },
                  conversationId,
                  senderId: currentUser.id
              });
          } else {
              toast({ variant: 'destructive', title: 'Sin dirección guardada', description: 'No tienes una dirección guardada en tu perfil.' });
          }
      }
  };
  
  const handleAcceptProposal = (messageId: string) => {
      if(!currentUser) return;
      acceptProposal(conversationId, messageId, currentUser.id);
  }

  return (
    <>
    <div className="flex flex-col h-screen bg-muted/30">
      <ChatHeader 
        participant={otherParticipant} 
        isSelfChat={isSelfChat}
        onDateSelect={handleDateSelect}
      />
      
      {showProviderWarning && (
          <Alert variant="destructive" className="rounded-none border-x-0">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Recomendación de Seguridad</AlertTitle>
              <AlertDescription>
                 Este usuario aún no ha activado su registro de transacciones. Sugiérele activarlo para disfrutar de la seguridad y garantías de la plataforma.
              </AlertDescription>
          </Alert>
      )}

      <div className="flex-grow bg-[url('/doodle-bg.png')] bg-repeat">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-2">
            {conversation.messages.map((msg) => {
              const isCurrentUserMsg = msg.senderId === currentUser.id;
              return (
                <MessageBubble 
                  key={msg.id} 
                  msg={msg} 
                  isCurrentUser={isCurrentUserMsg} 
                  onAccept={handleAcceptProposal} 
                  canAcceptProposal={canAcceptProposal} 
                  onForwardLocation={(loc) => sendMessage({ recipientId: otherParticipant.id, location: loc, conversationId, senderId: currentUser.id })}
                />
              )
            })}
          </div>
        </ScrollArea>
      </div>
      
      <footer className="p-2 border-t bg-transparent">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
           <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="bg-background rounded-full shadow-md" disabled={isSelfChat}>
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-1">
                <div className="flex flex-col gap-1">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start"><MapPin className="mr-2 h-4 w-4 text-red-500" />Ubicación</Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-auto p-1 ml-2">
                            <div className="flex flex-col gap-1">
                                <Button variant="ghost" className="w-full justify-start" onClick={() => handleSendLocation('current')}>Actual (GPS)</Button>
                                <Button variant="ghost" className="w-full justify-start" onClick={() => handleSendLocation('saved')}>Guardada en Perfil</Button>
                            </div>
                        </PopoverContent>
                     </Popover>
                    {isProvider && !isSelfChat && (
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setIsProposalDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4 text-green-500"/>Propuesta de Acuerdo</Button>
                    )}
                </div>
            </PopoverContent>
           </Popover>
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
