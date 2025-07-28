
'use client';

import { useCorabo } from '@/contexts/CoraboContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileHeart, X } from 'lucide-react';

export default function ContactsPage() {
  const { contacts, removeContact } = useCorabo();

  return (
    <main className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileHeart /> Contactos Guardados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <ul className="space-y-4">
              {contacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.profileImage} />
                      <AvatarFallback>
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {contact.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContact(contact.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center text-muted-foreground py-12">
              No tienes contactos guardados todavía.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
