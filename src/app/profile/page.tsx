
'use client';

import { ImageIcon } from 'lucide-react';
import { useCorabo } from '@/contexts/CoraboContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { currentUser } = useCorabo();
    const router = useRouter();

    if (!currentUser) return null;

  return (
    <div className="space-y-4">
        <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center text-center p-4 rounded-lg">
            <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg text-foreground">Tu Perfil</h3>
            <p className="text-muted-foreground text-sm">Navega a Publicaciones o Catálogo para ver tu contenido.</p>
        </div>
    </div>
  );
}
