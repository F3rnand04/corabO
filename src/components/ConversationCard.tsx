
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCorabo } from "@/contexts/CoraboContext";
import type { Conversation, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';

interface ConversationCardProps {
    conversation: Conversation;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
    const { currentUser, fetchUser } = useCorabo();
    const [otherParticipant, setOtherParticipant] = useState<User | null>(null);

    useEffect(() => {
        if (!currentUser || !conversation) return;
        
        const otherParticipantId = conversation.participantIds.find(pId => pId !== currentUser.id);
        if (otherParticipantId) {
            fetchUser(otherParticipantId).then(setOtherParticipant);
        }
    }, [conversation, currentUser, fetchUser]);


    if (!currentUser) return null;

    if (!otherParticipant) {
        // Special card for system messages
        if (conversation.id.includes('corabo-admin')) {
             const lastMessage = conversation.messages[conversation.messages.length - 1];
             const timeAgo = lastMessage ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true, locale: es }) : '';
             const unreadCount = conversation.messages.filter(m => !m.isRead && m.senderId !== currentUser.id).length;
            return (
                 <Link href={`/contacts`} passHref>
                    <div className="flex items-center p-3 gap-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm cursor-pointer hover:bg-blue-100/80 transition-colors">
                        <Avatar className="w-14 h-14">
                            <AvatarImage src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Admin" />
                            <AvatarFallback>C</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-blue-800">Corabo Admin</p>
                                <p className="text-xs text-blue-600 font-medium">{timeAgo}</p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-blue-700/90 truncate pr-2">
                                   {lastMessage?.text || "Mensaje del sistema."}
                                </p>
                                 {unreadCount > 0 && (
                                    <Badge variant="default" className="w-6 h-6 flex items-center justify-center p-0 rounded-full shrink-0 bg-blue-500 hover:bg-blue-600">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            )
        }
        return null;
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const unreadCount = conversation.messages.filter(m => !m.isRead && m.senderId !== currentUser.id).length;
    
    // Format timestamp
    const timeAgo = lastMessage ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true, locale: es }) : '';


    return (
        <Link href={`/messages/${conversation.id}`} passHref>
            <div className="flex items-center p-3 gap-4 bg-background rounded-xl shadow-sm cursor-pointer hover:bg-muted/80 transition-colors">
                <Avatar className="w-14 h-14">
                    <AvatarImage src={otherParticipant.profileImage} alt={otherParticipant.name} />
                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold truncate">{otherParticipant.name}</p>
                        <p className={cn(
                            "text-xs shrink-0 pl-2",
                            unreadCount > 0 ? "text-primary font-bold" : "text-muted-foreground"
                        )}>
                            {timeAgo}
                        </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-muted-foreground truncate pr-2">
                           {lastMessage?.type === 'proposal' ? '📝 Propuesta de Acuerdo' : lastMessage?.text || "No hay mensajes todavía."}
                        </p>
                        {unreadCount > 0 && (
                            <Badge variant="default" className="w-6 h-6 flex items-center justify-center p-0 rounded-full shrink-0">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
