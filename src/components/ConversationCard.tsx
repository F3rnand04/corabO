
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
import { useRouter } from 'next/navigation';
import * as Actions from '@/lib/actions';

interface ConversationCardProps {
    conversation: Conversation;
    otherParticipant: User | null;
}

export function ConversationCard({ conversation, otherParticipant }: ConversationCardProps) {
    const { currentUser } = useCorabo();
    const router = useRouter();

    if (!currentUser) return null;

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const unreadCount = conversation.messages.filter(m => !m.isRead && m.senderId !== currentUser.id).length;
    
    // Format timestamp
    const timeAgo = lastMessage ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true, locale: es }) : '';
    
    const participantName = otherParticipant ? (otherParticipant.id === currentUser.id ? "Tú (Notas)" : otherParticipant.name) : 'Sistema';
    const participantImage = otherParticipant ? otherParticipant.profileImage : "https://i.postimg.cc/Wz1MTvWK/lg.png";
    const fallbackChar = participantName.charAt(0) || 'S';

    const cardStyles = otherParticipant && otherParticipant.id !== currentUser.id
        ? "bg-background hover:bg-muted/80" 
        : "bg-blue-50 border border-blue-200 hover:bg-blue-100/80";

    const nameStyles = otherParticipant ? (otherParticipant.id === currentUser.id ? "" : "") : "text-blue-800";
    const timeStyles = otherParticipant ? (unreadCount > 0 ? "text-primary font-bold" : "text-muted-foreground") : "text-blue-600 font-medium";
    const messageStyles = otherParticipant ? "text-muted-foreground" : "text-blue-700/90";

    const handleNavigation = async () => {
        if (!otherParticipant) {
             router.push(`/messages/${conversation.id}`);
             return;
        }
        
        // This is now purely for navigation after the action has been called
        // by the context listener.
        const conversationId = [currentUser.id, otherParticipant.id].sort().join('-');

        // Optimistically mark as read on client before navigating
        if(unreadCount > 0) {
            Actions.markConversationAsRead(conversationId);
        }

        router.push(`/messages/${conversationId}`);
    };

    return (
        <div 
            onClick={handleNavigation}
            className={cn("flex items-center p-3 gap-4 rounded-xl shadow-sm cursor-pointer transition-colors", cardStyles)}
        >
            <Avatar className="w-14 h-14">
                <AvatarImage src={participantImage} alt={participantName} />
                <AvatarFallback>{fallbackChar}</AvatarFallback>
            </Avatar>
            <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className={cn("font-semibold truncate", nameStyles)}>{participantName}</p>
                    <p className={cn("text-xs shrink-0 pl-2", timeStyles)}>
                        {timeAgo}
                    </p>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <p className={cn("text-sm truncate pr-2", messageStyles)}>
                       {lastMessage?.type === 'proposal' ? '📝 Propuesta de Acuerdo' : lastMessage?.text || "No hay mensajes todavía."}
                    </p>
                    {unreadCount > 0 && (
                        <Badge variant="default" className={cn("w-6 h-6 flex items-center justify-center p-0 rounded-full shrink-0", !otherParticipant && "bg-blue-500 hover:bg-blue-600")}>
                            {unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
