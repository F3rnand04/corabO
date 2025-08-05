
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bookmark, Send, Star, MessageCircle } from 'lucide-react';
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
            <div className="flex-grow" />

            {/* Right side actions */}
             <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6">
                <Link href={`/companies/${user!.id}`} className="block">
                    <Avatar className="w-12 h-12 border-2 border-white">
                        <AvatarImage src={user!.profileImage} alt={user!.name} />
                        <AvatarFallback>{user!.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12">
                        <Star className="w-7 h-7" />
                    </Button>
                    <span className="text-sm font-bold mt-1 drop-shadow-md">8.9k</span>
                </div>
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12">
                        <MessageCircle className="w-7 h-7" />
                    </Button>
                    <span className="text-sm font-bold mt-1 drop-shadow-md">1.2k</span>
                </div>
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12">
                        <Send className="w-7 h-7" />
                    </Button>
                    <span className="text-sm font-bold mt-1 drop-shadow-md">4.5k</span>
                </div>
                <div className="flex flex-col items-center">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white bg-black/30 rounded-full h-12 w-12">
                        <Bookmark className="w-7 h-7" />
                    </Button>
                    <span className="text-sm font-bold mt-1 drop-shadow-md">Guardar</span>
                </div>
            </div>

            {/* Bottom info */}
            <div className="mb-16">
                <Link href={`/companies/${user!.id}`} passHref>
                    <a className="font-bold text-base drop-shadow-md hover:underline">{user!.name}</a>
                </Link>
                <p className="text-sm drop-shadow-md mt-1">
                    Descripción del video o servicio que se está mostrando... #hashtag #servicio
                </p>
                <p className="text-xs font-semibold mt-2 drop-shadow-md">Ver traducción</p>
            </div>
            
          </div>
        </div>
      ))}
    </div>
  );
}
