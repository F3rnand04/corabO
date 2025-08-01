
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

    const otherParticipantId = conversation.participantIds.find(pId => pId !== currentUser.id);
    const otherParticipant = users.find(u => u.id === otherParticipantId);

    if (!otherParticipant) {
        return null;
    }

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const unreadCount = conversation.unreadCount || 0;
    
    // Format timestamp
    const timeAgo = lastMessage ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true, locale: es }) : '';


    return (
        <Link href={`/messages/${conversation.id}`} passHref>
            <div className="flex items-center p-3 gap-4 bg-background rounded-xl shadow-sm cursor-pointer hover:bg-muted/80 transition-colors">
                <Avatar className="w-14 h-14">
                    <AvatarImage src={otherParticipant.profileImage} alt={otherParticipant.name} />
                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold">{otherParticipant.name}</p>
                        <p className={cn(
                            "text-xs",
                            unreadCount > 0 ? "text-primary font-bold" : "text-muted-foreground"
                        )}>
                            {timeAgo}
                        </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-muted-foreground truncate w-4/5">
                            {lastMessage?.text || "No hay mensajes todavía."}
                        </p>
                        {unreadCount > 0 && (
                            <Badge variant="default" className="w-6 h-6 flex items-center justify-center p-0 rounded-full">
                                {unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
