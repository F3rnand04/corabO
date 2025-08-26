
'use client';

import { useRef, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { updateUserProfileImage } from '@/lib/actions/user.actions';

interface EditableAvatarProps {
  user: {
    id: string;
    name: string;
    profileImage: string;
  };
}

export function EditableAvatar({ user }: EditableAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          updateUserProfileImage(user.id, dataUrl).then(() => {
              toast({
                  title: "¡Foto de Perfil Actualizada!",
                  description: "Tu nueva foto de perfil está visible.",
              });
          }).catch(err => {
               toast({
                  variant: "destructive",
                  title: "Error al subir la imagen",
                  description: err.message,
              });
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative shrink-0">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      <Avatar className="w-16 h-16 cursor-pointer" onClick={handleAvatarClick}>
        <AvatarImage src={user.profileImage} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <Button size="icon" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full" onClick={handleAvatarClick}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
