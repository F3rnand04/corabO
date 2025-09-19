
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { CheckCheck, FileText, Image as ImageIcon } from 'lucide-react';
import { ProposalBubble } from './ProposalBubble';
import { LocationBubble } from './LocationBubble';

interface MessageBubbleProps {
  msg: Message;
  isCurrentUser: boolean;
  onAccept: (messageId: string) => void;
  canAcceptProposal: boolean;
  onForwardLocation: (location: { lat: number, lon: number }) => void;
}

export function MessageBubble({ msg, isCurrentUser, onAccept, canAcceptProposal, onForwardLocation }: MessageBubbleProps) {
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        // Format time only on the client to prevent hydration mismatch
        setFormattedTime(format(new Date(msg.timestamp), 'HH:mm'));
    }, [msg.timestamp]);

    if (msg.type === 'proposal') {
        return <ProposalBubble msg={msg} onAccept={onAccept} canAccept={canAcceptProposal} />;
    }

    if (msg.type === 'location' && msg.location) {
        return <LocationBubble lat={msg.location.lat} lon={msg.location.lon} onForward={() => onForwardLocation(msg.location!)} />;
    }
    
    if (msg.type === 'image' && msg.media) {
        return (
            <div className={cn("flex flex-col items-end gap-2 max-w-[85%] w-fit", isCurrentUser ? "ml-auto" : "mr-auto")}>
                 <a href={msg.media.url} target="_blank" rel="noopener noreferrer" className="block relative w-64 aspect-square rounded-lg overflow-hidden border bg-background shadow-md group">
                    <Image src={msg.media.url} alt="Imagen adjunta" width={256} height={256} className="object-cover w-full h-full" />
                 </a>
                 <div className={cn("text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>{formattedTime || '...'}</div>
            </div>
        )
    }
    
    if (msg.type === 'document' && msg.media) {
        return (
            <div className={cn("flex items-end gap-2 max-w-[85%] w-fit", isCurrentUser ? "ml-auto" : "mr-auto")}>
                <a href={msg.media.url} download={msg.media.fileName} target="_blank" rel="noopener noreferrer" className={cn("p-3 rounded-lg shadow-md flex items-center gap-3", isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background rounded-bl-none")}>
                     <FileText className="w-8 h-8 flex-shrink-0" />
                     <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{msg.media.fileName}</p>
                        <p className="text-xs opacity-80">{msg.media.fileType}</p>
                     </div>
                </a>
             </div>
        )
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
