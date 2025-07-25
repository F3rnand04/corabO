
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, MessageCircle, X, Copy, Settings, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SettingsFooter from '@/components/SettingsFooter';


export default function SettingsPage() {
  const { currentUser, contacts, removeContact } = useCorabo();
  const router = useRouter();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Here you would typically show a toast notification
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="container sticky top-0 bg-background/95 backdrop-blur z-10 py-3">
        <div className="flex items-center justify-between">
           <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="font-bold text-lg">Ajustes</h1>
           <Link href="#" passHref>
             <Button variant="link" className="text-sm">
                SUSCRIBIR
             </Button>
           </Link>
        </div>
      </header>
      
      <main className="container py-4 px-4 space-y-6 max-w-2xl pb-24">

        {/* User Info Section */}
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex-grow'>
            <p className="font-bold">ID corabO</p>
            <p className="text-sm text-muted-foreground">Correo: uruario@gmail.com</p>
            <p className="text-sm text-muted-foreground">teléfono: 0412 12345678</p>
          </div>
        </div>

        {/* Validation Section */}
        <div className="text-right -mt-4">
            <div className="flex items-center justify-end gap-2">
                <span className="font-mono text-sm">ABC123456</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy('ABC123456')}>
                    <Copy className="h-4 w-4 text-muted-foreground"/>
                </Button>
            </div>
            <p className="text-sm text-green-500 font-semibold">Validado</p>
        </div>
        
        <Separator />

        {/* Contacts Section */}
        <div>
          <h2 className="text-lg font-bold mb-4">Contactos</h2>
          <div className="space-y-3">
            {contacts.length > 0 ? (
              contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/70">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${contact.id}`} alt={contact.name} />
                      <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">Especialidad</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background" onClick={() => removeContact(contact.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No tienes contactos guardados.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
