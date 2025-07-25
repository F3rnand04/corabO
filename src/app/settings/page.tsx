
'use client';

import { useState } from 'react';
import { useCorabo } from '@/contexts/CoraboContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, MessageCircle, X, Copy, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { currentUser, contacts, removeContact, services } = useCorabo();
  const router = useRouter();
  const { toast } = useToast();

  const [isPhoneValidated, setIsPhoneValidated] = useState(false);
  const [isValidationSent, setIsValidationSent] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [validationError, setValidationError] = useState('');

  const [isEmailValidated, setIsEmailValidated] = useState(false);
  const [isEmailValidationSent, setIsEmailValidationSent] = useState(false);
  const [emailValidationCode, setEmailValidationCode] = useState('');
  const [emailValidationError, setEmailValidationError] = useState('');


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "ID copiado al portapapeles." });
  };

  const handleValidatePhoneClick = () => {
    setIsValidationSent(true);
    setValidationError('');
    toast({ title: "Código Enviado", description: "Se envió un código a tu número. (El código es 123456)" });
  };

  const handleConfirmValidation = () => {
    if (validationCode === '123456') {
      setIsPhoneValidated(true);
      setIsValidationSent(false);
      setValidationCode('');
      setValidationError('');
      toast({
        title: "Teléfono Validado",
        description: "Tu número ha sido validado con éxito.",
      });
    } else {
      setValidationError('El código ingresado es incorrecto.');
    }
  };

  const handleValidateEmailClick = () => {
    setIsEmailValidationSent(true);
    setEmailValidationError('');
    toast({ title: "Código Enviado", description: "Se envió un código a tu correo. (El código es 123456)" });
  };

  const handleConfirmEmailValidation = () => {
    if (emailValidationCode === '123456') {
        setIsEmailValidated(true);
        setIsEmailValidationSent(false);
        setEmailValidationCode('');
        setEmailValidationError('');
        toast({
            title: "Correo Validado",
            description: "Tu correo ha sido validado con éxito.",
        });
    } else {
        setEmailValidationError('El código ingresado es incorrecto.');
    }
  };


  return (
    <div className="bg-background min-h-screen">
      <main className="container py-4 px-4 space-y-6 max-w-2xl pb-24">
        {/* User Info & Subscription Section */}
        <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20 shrink-0">
              <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
              <AvatarFallback>Foto</AvatarFallback>
            </Avatar>

            <div className="flex-grow space-y-1 w-full">
                <div className="flex flex-col items-end">
                     <Link href="#" passHref>
                        <span className="text-sm text-red-500 font-semibold cursor-pointer">SUSCRIBIR</span>
                    </Link>
                    <p className="font-bold text-lg text-right">Nivel 1</p>
                </div>
                
                <div className="flex justify-between items-center">
                    <p className="font-bold">ID corabO</p>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">ABC123456</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy('ABC123456')}>
                            <Copy className="h-4 w-4 text-muted-foreground"/>
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Correo: uruario@gmail.com</p>
                    {isEmailValidated ? (
                        <div className="flex items-center gap-1 text-sm text-green-500 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            <span>Validado</span>
                        </div>
                    ) : (
                        <Button variant="link" className="h-auto p-0 text-sm text-primary" onClick={handleValidateEmailClick} disabled={isEmailValidationSent}>
                            Validar
                        </Button>
                    )}
                </div>
                {isEmailValidationSent && !isEmailValidated && (
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center gap-2">
                            <Input 
                                type="text"
                                placeholder="Ingresa el código"
                                value={emailValidationCode}
                                onChange={(e) => {
                                    setEmailValidationCode(e.target.value);
                                    setEmailValidationError('');
                                }}
                                className="h-8"
                            />
                            <Button size="sm" onClick={handleConfirmEmailValidation}>Confirmar</Button>
                        </div>
                        {emailValidationError && <p className="text-xs text-red-500">{emailValidationError}</p>}
                    </div>
                )}


                 <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">teléfono: 0412 12345678</p>
                    {isPhoneValidated ? (
                         <div className="flex items-center gap-1 text-sm text-green-500 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            <span>Validado</span>
                        </div>
                    ) : (
                        <Button variant="link" className="h-auto p-0 text-sm text-primary" onClick={handleValidatePhoneClick} disabled={isValidationSent}>
                            Validar
                        </Button>
                    )}
                </div>
                {isValidationSent && !isPhoneValidated && (
                    <div className="pt-2 space-y-2">
                        <div className="flex items-center gap-2">
                            <Input 
                                type="text"
                                placeholder="Ingresa el código"
                                value={validationCode}
                                onChange={(e) => {
                                    setValidationCode(e.target.value);
                                    setValidationError('');
                                }}
                                className="h-8"
                            />
                            <Button size="sm" onClick={handleConfirmValidation}>Confirmar</Button>
                        </div>
                        {validationError && <p className="text-xs text-red-500">{validationError}</p>}
                    </div>
                )}
            </div>
        </div>
        
        <Separator />

        {/* Contacts Section */}
        <div>
          <h2 className="text-lg font-bold mb-4">Contactos</h2>
          <div className="space-y-3">
            {contacts.length > 0 ? (
              contacts.map(contact => {
                const contactService = services.find(s => s.providerId === contact.id);
                const specialty = contactService ? `Ofrece: ${contactService.name}` : 'Especialidad no definida';

                return (
                  <div key={contact.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/70">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.profileImage} alt={contact.name} />
                        <AvatarFallback>Foto</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{specialty}</p>
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
                )
              })
            ) : (
               <>
                 {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-muted/70 animate-pulse">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 bg-gray-300">
                                <AvatarFallback></AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-24"></div>
                                <div className="h-3 bg-gray-300 rounded w-20"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                            <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                        </div>
                    </div>
                 ))}
               </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
