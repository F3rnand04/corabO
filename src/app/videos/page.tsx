
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bookmark, Send, Star, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { GalleryImage, User } from '@/lib/types';
import { ImageDetailsDialog } from '@/components/ImageDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Component for a single video reel item
function ReelItem({ video, owner }: { video: GalleryImage, owner: User }) {
    const { addContact, isContact } = useCorabo();
    const { toast } = useToast();
    
    // State for interaction within this specific reel
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 5000));
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(isContact(owner.id));

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    const handleSave = () => {
        if (!isSaved) {
            addContact(owner);
            setIsSaved(true);
            toast({ title: "Guardado", description: `Has guardado el perfil de ${owner.name}.` });
        }
    };
    
    const handleShare = async () => {
        const shareData = {
          title: `Mira este video de ${owner.name}`,
          text: video.description,
          url: window.location.origin + `/companies/${owner.id}`,
        };
        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            throw new Error("Share API not supported");
          }
        } catch (error) {
           navigator.clipboard.writeText(shareData.url);
           toast({
             title: "Enlace Copiado",
             description: "El enlace al perfil del creador ha sido copiado.",
           });
        }
    }


    return (
        <>
            <div className="h-full w-full snap-start relative flex items-center justify-center bg-black">
                {/* The video player */}
                <video
                    className="h-full w-full object-contain"
                    src={video.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    key={video.src}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                
                <div className="absolute inset-0 z-20 text-white flex flex-col p-4">
                    {/* Header section (empty for now) */}
                    <div className="flex-grow" />

                    {/* Right side actions */}
                    <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6">
                        <Link href={`/companies/${owner.id}`} className="block">
                            <Avatar className="w-12 h-12 border-2 border-white">
                                <AvatarImage src={owner.profileImage} alt={owner.name} />
                                <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex flex-col items-center">
                            <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12" onClick={handleLike}>
                                <Star className={cn("w-7 h-7 transition-all", isLiked && "fill-yellow-400 text-yellow-400")} />
                            </Button>
                            <span className="text-sm font-bold mt-1 drop-shadow-md">{likeCount.toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12" onClick={() => setIsDetailsOpen(true)}>
                                <MessageCircle className="w-7 h-7" />
                            </Button>
                            <span className="text-sm font-bold mt-1 drop-shadow-md">{(video.comments?.length || 0).toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex flex-col items-center">
                             <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12" onClick={handleShare}>
                                <Send className="w-7 h-7" />
                            </Button>
                            <span className="text-sm font-bold mt-1 drop-shadow-md">{(Math.random() * 2000).toFixed(0)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12" onClick={handleSave}>
                                <Bookmark className={cn("w-7 h-7", isSaved && "fill-primary text-primary")} />
                            </Button>
                            <span className="text-sm font-bold mt-1 drop-shadow-md">Guardar</span>
                        </div>
                    </div>

                    {/* Bottom info */}
                    <div className="mb-16 max-w-[calc(100%-5rem)]">
                        <Link href={`/companies/${owner.id}`} className="font-bold text-base drop-shadow-md hover:underline">
                            @{owner.profileSetupData?.username || owner.name.replace(/\s+/g, '').toLowerCase()}
                        </Link>
                        <p className="text-sm drop-shadow-md mt-1 line-clamp-2">
                           {video.description}
                        </p>
                    </div>
                </div>
            </div>
             <ImageDetailsDialog
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                gallery={[video]}
                owner={owner}
                startIndex={0}
            />
        </>
    );
}


export default function VideosPage() {
  const { users } = useCorabo();

  // Create a dynamic feed by finding all videos from all users' galleries
  const videoFeed = users.flatMap(user => 
    (user.gallery || [])
        .filter(item => item.type === 'video')
        .map(video => ({ video, owner: user }))
  );
  
  // Shuffle the feed for variety on each load
  const shuffledFeed = videoFeed.sort(() => Math.random() - 0.5);

  return (
    <div className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory bg-black">
      {shuffledFeed.length > 0 ? (
          shuffledFeed.map(({ video, owner }) => (
            <ReelItem key={video.id} video={video} owner={owner} />
          ))
      ) : (
        <div className="h-full w-full flex items-center justify-center text-white">
            <p>No hay videos para mostrar.</p>
        </div>
      )}
    </div>
  );
}
