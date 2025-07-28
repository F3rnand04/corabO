
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Copy, MessageSquare, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ValidationItem } from '@/components/ValidationItem';

function ContactsHeader() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="text-right">
            <p className="font-bold text-sm text-red-500">SUSCRIBIR</p>
            <p className="font-bold text-lg">Nivel 1</p>
          </div>
        </div>
      </div>
    </header>
  );
}


export default function ContactsPage() {
  const { currentUser, contacts, removeContact } = useCorabo();

  return (
    <>
    <ContactsHeader />
    <main className="bg-muted/30 min-h-screen">
      <div className="container py-6 px-4">
        {/* User Info Section */}
        <div className="bg-background p-4 rounded-xl shadow-sm mb-6">
            <div className='flex items-center gap-4'>
                <Avatar className="w-16 h-16 border-2 border-muted shrink-0">
                    <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <p className="font-bold">ID corabO</p>
                    <div className="flex items-center gap-2">
                       <p className="font-mono text-sm">ABC123456</p>
                       <Button variant="ghost" size="icon" className="w-6 h-6">
                            <Copy className="w-4 h-4 text-muted-foreground" />
                       </Button>
                    </div>
                </div>
            </div>
             <div className="mt-4 space-y-2">
                <ValidationItem
                    label="Correo:"
                    value="uruario@gmail.com"
                    initialStatus="validated"
                />
                <ValidationItem
                    label="Teléfono:"
                    value="0412 12345678"
                    initialStatus="idle"
                />
            </div>
        </div>

        {/* Contacts List */}
        <h2 className="text-xl font-bold mb-4 px-2">Contactos</h2>
        
        <div className="space-y-3">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <Card key={contact.id} className="rounded-full shadow-sm">
                <CardContent className="p-2 flex items-center justify-between">
                    <div className='flex items-center gap-3'>
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={contact.profileImage} alt={contact.name} />
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">Especialidad</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                            <MessageSquare className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => removeContact(contact.id)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-center text-muted-foreground py-12">
              No tienes contactos guardados todavía.
            </p>
          )}
        </div>
      </div>
    </main>
    </>
  );
}
