
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Trash2 } from 'lucide-react';
import type { GalleryImage, GalleryImageComment } from '@/lib/types';
import { addCommentToImage, removeCommentFromImage } from '@/lib/actions/publication.actions';
import { db } from '@/lib/firebase-client';

interface PublicationCommentsProps {
    publicationId: string;
    ownerId: string;
}

export function PublicationComments({ publicationId, ownerId }: PublicationCommentsProps) {
    const { currentUser } = useAuth();
    const [publication, setPublication] = useState<GalleryImage | null>(null);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (!publicationId) return;
        
        const unsub = onSnapshot(doc(db, "publications", publicationId), (doc) => {
            setPublication(doc.data() as GalleryImage);
        });

        return () => unsub();
    }, [publicationId]);

    const handlePostComment = () => {
        if (newComment.trim() && publication && currentUser) {
            addCommentToImage({
                ownerId: ownerId,
                imageId: publication.id,
                commentText: newComment,
                author: {
                    id: currentUser.id,
                    name: currentUser.name,
                    profileImage: currentUser.profileImage
                }
            });
            setNewComment("");
        }
    }
  
    const handleDeleteComment = (commentIndex: number) => {
        if (publication) {
            removeCommentFromImage(publicationId, commentIndex);
        }
    }
    
    if (!currentUser || !publication) return null; // Or a loading skeleton

    const isOwnerView = currentUser.id === ownerId;

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comentarios ({publication.comments?.length || 0})
            </h3>
            <div className="space-y-4">
                {publication.comments?.map((comment, index) => (
                   <div key={index} className="flex items-start gap-3 group">
                       <Avatar className="w-8 h-8 shrink-0">
                           <AvatarImage src={comment.profileImage} alt={comment.author} />
                           <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div className="flex-grow">
                           <p className="font-semibold text-sm">{comment.author}</p>
                           <p className="text-sm text-muted-foreground">{comment.text}</p>
                           <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                              <Button variant="ghost" size="icon" className="w-6 h-6"><ThumbsUp className="w-4 h-4"/></Button>
                              <span className="text-xs">{comment.likes || 0}</span>
                              <Button variant="ghost" size="icon" className="w-6 h-6"><ThumbsDown className="w-4 h-4"/></Button>
                              <span className="text-xs">{comment.dislikes || 0}</span>
                           </div>
                       </div>
                       {(comment.authorId === currentUser.id || isOwnerView) && (
                           <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteComment(index)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                        )}
                   </div>
                ))}
                 {!publication.comments?.length && (
                     <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios aún. ¡Sé el primero!</p>
                 )}
            </div>
             <div className="mt-6 flex items-center gap-2">
                <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={currentUser.profileImage} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input 
                    placeholder="Añade un comentario..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                />
                <Button onClick={handlePostComment} disabled={!newComment.trim()} size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
