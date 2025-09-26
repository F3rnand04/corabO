
'use client';

import { useAuth } from '@/hooks/use-auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Copy, MessageSquare, X, CheckCircle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ValidationItem } from '@/components/ValidationItem';
import { SubscriptionDialog } from '@/components/SubscriptionDialog';
import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ContactSupportCard } from '@/components/ContactSupportCard';
import { sendMessage } from '@/lib/actions/messaging.actions';


function ContactsHeader({ onSubscribeClick }: { onSubscribeClick: () => void }) {
  const router = useRouter();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="text-right cursor-pointer" onClick={onSubscribeClick}>
            <p className="font-bold text-sm text-red-500">
                {currentUser.isSubscribed ? 'PLAN ACTIVO' : 'SUSCRIBIR'}
            </p>
            <p className="font-bold text-lg flex items-center gap-1">
                {currentUser.isSubscribed && <CheckCircle className="w-4 h-4 text-green-500"/>}
                Nivel 1
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}


export default function ContactsPage() {
  const { currentUser, contacts, removeContact } = useAuth();
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!currentUser) {
    return null; 
  }

  const handleDirectMessage = async (contactId: string) => {
    if (!currentUser) return;
    const conversationId = [currentUser.id, contactId].sort().join('-')
    await sendMessage({ recipientId: contactId, text: "", conversationId, senderId: currentUser.id });
    router.push(`/messages/${conversationId}`);
  };
  
  const handleRemoveContact = (contactId: string) => {
    if (!currentUser) return;
    removeContact(contactId);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado', description: `Tu ID de Corabo ha sido copiado.` });
  }

  return (
    <>
    <ContactsHeader onSubscribeClick={() => setIsSubscriptionDialogOpen(true)} />
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
                    <p className="font-bold text-foreground">Tu ID CorabO</p>
                    <div className="flex items-center gap-2">
                       <p className="font-mono text-lg">{currentUser.coraboId || ''}</p>
                       <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => copyToClipboard(currentUser.coraboId || '')}>
                            <Copy className="w-4 h-4 text-muted-foreground" />
                       </Button>
                    </div>
                </div>
            </div>
             <div className="mt-4 space-y-2">
                <ValidationItem
                    label="Correo:"
                    value={currentUser.email}
                    initialStatus={currentUser.emailValidated ? 'validated' : 'idle'}
                    type="email"
                />
                <ValidationItem
                    label="Teléfono:"
                    value={currentUser.phone}
                    initialStatus={currentUser.phoneValidated ? 'validated' : 'idle'}
                    type="phone"
                />
            </div>
        </div>

        {!currentUser.isSubscribed && (
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="mx-auto bg-primary/20 text-primary w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Desbloquea tu Potencial</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Obtén tu insignia de verificado, llega a más clientes y accede a beneficios exclusivos.
              </p>
              <Button onClick={() => setIsSubscriptionDialogOpen(true)}>
                Ver Planes de Suscripción
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contacts List */}
        <h2 className="text-xl font-bold mb-4 px-2 mt-8">Mis Contactos Guardados</h2>
        
        <div className="space-y-3">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <Card key={contact.id} className="rounded-full shadow-sm">
                <CardContent className="p-2 flex items-center justify-between">
                    <Link href={`/companies/${contact.id}`} className="flex items-center gap-3 group">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={contact.profileImage} alt={contact.name} />
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm group-hover:underline">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.profileSetupData?.specialty || "Sin especialidad"}</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2 pr-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => handleDirectMessage(contact.id)}>
                            <MessageSquare className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => handleRemoveContact(contact.id)}>
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
        <div className='py-4'>
            <ContactSupportCard />
        </div>
      </div>
    </main>
    <SubscriptionDialog isOpen={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen} />
    </>
  );
}
