
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bookmark, Send, Star } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function VideosPage() {
  const { users } = useCorabo();

  // Create a dummy feed by mixing users
  const videoFeed = [users.find(u => u.id === 'provider2'), users.find(u => u.id === 'provider1')].filter(Boolean);

  return (
    <div className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory bg-black">
      {videoFeed.map((user, index) => (
        <div key={`${user!.id}-${index}`} className="h-full w-full snap-start relative flex items-center justify-center">
          {/* Placeholder for video */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
           <video
            className="h-full w-full object-cover"
            src={`https://placehold.co/1080x1920.mp4?text=Video+${index+1}`}
            autoPlay
            loop
            muted
            playsInline
          />
          
          <div className="absolute inset-0 z-20 text-white flex flex-col p-4">
            {/* Header section */}
            <div className="flex items-start justify-between">
                <Link href={`/companies/${user!.id}`}>
                    <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-white">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${user!.id}`} alt={user!.name} />
                            <AvatarFallback>{user!.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-base drop-shadow-md">{user!.name}</p>
                            <p className="text-sm drop-shadow-md">Especialidad</p>
                            <div className="flex items-center gap-2 text-sm mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                                    <span className="font-semibold">{user!.reputation.toFixed(1)}</span>
                                </div>
                                <span>99.9% Efec.</span>
                            </div>
                        </div>
                    </div>
                </Link>
                <Button variant="ghost" size="icon" className="text-white">
                    <Bookmark className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex-grow" />

            {/* Right side actions */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12">
                        <Send className="w-6 h-6" />
                    </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">4567</span>
                </div>
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12">
                        <Star className="w-6 h-6" />
                    </Button>
                    <span className="text-xs font-bold mt-1 drop-shadow-md">8934.5</span>
                </div>
            </div>

            {/* Bottom info */}
            <div className="mb-16">
                <h3 className="font-bold text-lg drop-shadow-md">Título del Video</h3>
            </div>
            
            {/* Bottom action bar */}
            <div className="absolute bottom-16 left-0 right-0">
                <div className="flex justify-around items-center p-2 text-center text-sm font-semibold">
                    <Button variant="ghost" className="flex-1 text-white text-base">Mensaje</Button>
                    <Separator orientation="vertical" className="h-6 bg-white/50" />
                     <Link href={`/companies/${user!.id}`} passHref className="flex-1">
                        <Button variant="ghost" className="w-full text-white text-base">Ver Perfil</Button>
                    </Link>
                    <Separator orientation="vertical" className="h-6 bg-white/50" />
                    <Button variant="ghost" className="flex-1 text-white text-base">Comentarios</Button>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
