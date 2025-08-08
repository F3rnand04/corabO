
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCorabo } from "@/contexts/CoraboContext";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConversationCardProps {
    conversation: Conversation;
}

export function ConversationCard({ conversation }: ConversationCardProps) {
    const { users, currentUser } = useCorabo();

    if (!currentUser) return null;

    const otherParticipantId = conversation.participantIds.find(pId => pId !== currentUser.id);
    const otherParticipant = users.find(u => u.id === otherParticipantId);

    if (!otherParticipant) {
        return null; // Or some fallback for conversations with deleted users
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    // In a real app, unreadCount would come from the backend. We'll simulate it.
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
