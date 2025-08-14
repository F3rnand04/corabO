
'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, ChevronLeft, Upload, Check, Loader2, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const promotionSuggestions = ["10% OFF", "2x1 Hoy", "Envío Gratis", "Oferta Especial", "Nuevo"];

export default function EmprendePage() {
  const { currentUser, activatePromotion, updateUserProfileAndGallery } = useCorabo();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [tempImagePreview, setTempImagePreview] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const [promotionText, setPromotionText] = useState('');
  const [reference, setReference] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPromotionCost = () => {
    if(!currentUser) return 0;
    return currentUser.type === 'provider' ? 8 : 5;
  }
  const promotionCost = getPromotionCost();

  useEffect(() => {
    if (currentUser && !currentUser.isTransactionsActive) {
      toast({
        variant: "destructive",
        title: "Registro de Transacciones Inactivo",
        description: "Debes activar tu registro de transacciones para poder usar esta función.",
      });
      router.push('/profile');
    }
  }, [currentUser, router, toast]);

  const activePromotion = currentUser?.promotion;
  
  if (activePromotion && new Date(activePromotion.expires) > new Date()) {
    return (
      <div className="container mx-auto max-w-2xl py-8 text-center">
         <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
            <Clock className="h-4 w-4 !text-green-800" />
            <AlertTitle>¡Ya tienes una promoción activa!</AlertTitle>
            <AlertDescription>
              La oferta <Badge variant="secondary" className="mx-1">{activePromotion.text}</Badge> expirará pronto. Solo se puede tener una promoción activa a la vez.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/profile')} className="mt-6">Volver al Perfil</Button>
      </div>
    )
  }

  const handleTempFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setTempImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const goToNextStep = () => {
    if (!tempImageFile || !tempDescription.trim()) {
        toast({ variant: "destructive", title: "Falta información", description: "Por favor, sube una imagen y añade una descripción para tu oferta." });
        return;
    }
    setStep(2);
  };
  
  const handleConfirmAndActivate = async () => {
    if (!reference || !voucherFile) {
        toast({ variant: "destructive", title: "Faltan datos de pago", description: "Sube el comprobante y añade la referencia." });
        return;
    }
    if (!tempImageFile || !tempDescription.trim() || !currentUser) {
        toast({ variant: "destructive", title: "Falta información de la oferta", description: "Hubo un error, por favor vuelve al paso anterior." });
        return;
    }

    setIsSubmitting(true);
    
    const newTempImage = {
      id: `temp-${Date.now()}`,
      src: tempImagePreview!,
      alt: tempDescription.slice(0, 30),
      description: tempDescription,
      comments: [],
      isTemporary: true,
    };
    
    try {
        await updateUserProfileAndGallery(currentUser.id, newTempImage);
        await activatePromotion({ imageId: newTempImage.id, promotionText, cost: promotionCost });

        toast({ title: "¡Promoción Activada!", description: "Tu oferta destacará por 24 horas." });
        router.push('/profile');

    } catch (error) {
        console.error("Error activating promotion:", error);
        toast({ variant: "destructive", title: "Error al activar", description: "No se pudo activar la promoción." });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-muted/30 min-h-screen">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => step === 1 ? router.back() : setStep(1)}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500"/>
                    Emprende por Hoy
                </h1>
                <div className="w-8"></div>
            </div>
        </div>
      </header>

      <main className="container py-8 max-w-2xl mx-auto">
        <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>
                {step === 1 ? 'Paso 1: Define tu Oferta' : 'Paso 2: Realiza el Pago'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Describe el producto o servicio que quieres probar en el mercado por 24 horas.' 
                  : `Para activar tu oferta, realiza el pago de $${promotionCost.toFixed(2)} y registra los detalles.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="temp-desc">Describe tu oferta</Label>
                      <Textarea id="temp-desc" placeholder="Ej: Vendo deliciosas tortas de chocolate por encargo..." value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temp-img">Sube una imagen de tu producto/servicio</Label>
                      <Input id="temp-img" type="file" accept="image/*" onChange={handleTempFileChange} />
                    </div>

                    {tempImagePreview && (
                         <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                            <Image src={tempImagePreview} alt="Vista previa" fill style={{objectFit: 'cover'}} data-ai-hint="promotional image"/>
                            {promotionText && (
                            <Badge variant="destructive" className="absolute top-2 left-2 shadow-lg">
                                {promotionText}
                            </Badge>
                            )}
                        </div>
                    )}
                 
                    <div className="space-y-2">
                        <Label htmlFor="promotion-text">Texto de la Oferta (Opcional)</Label>
                        <Input
                        id="promotion-text"
                        value={promotionText}
                        onChange={(e) => setPromotionText(e.target.value)}
                        placeholder="Ej: HOY 15% OFF"
                        maxLength={15}
                        />
                        <div className="flex flex-wrap gap-1 pt-1">
                            {promotionSuggestions.map(suggestion => (
                                <Badge 
                                    key={suggestion} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-muted"
                                    onClick={() => setPromotionText(suggestion)}
                                >
                                    {suggestion}
                                </Badge>
                            ))}
                        </div>
                    </div>
                     <Button 
                        onClick={goToNextStep} 
                        disabled={!tempImageFile || !tempDescription.trim()}
                        className="w-full"
                    >
                        Continuar al Pago
                    </Button>
                </div>
              )}
               {step === 2 && (
                   <div className="space-y-6">
                     <div className="space-y-2">
                       <p className="text-sm font-semibold text-foreground">Realiza el pago a los siguientes datos:</p>
                       <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md space-y-1">
                          <p><strong>Banco:</strong> Banco de Venezuela</p>
                          <p><strong>Cuenta:</strong> 0102-0333-30-0000982322</p>
                          <p><strong>Pago Móvil:</strong> 0412-8978405</p>
                          <p><strong>RIF:</strong> J-50704220-0</p>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <p className="text-sm font-semibold text-foreground">Luego, registra tu pago aquí:</p>
                       <div className="space-y-2">
                          <Label htmlFor="voucher-upload">Comprobante de Pago</Label>
                          <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm"><Label htmlFor="voucher-upload" className="cursor-pointer"><Upload className="h-4 w-4 mr-2"/>Subir</Label></Button>
                             <Input 
                                id="voucher-upload" 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => setVoucherFile(e.target.files ? e.target.files[0] : null)}
                              />
                             <span className={cn("text-sm text-muted-foreground", voucherFile && "text-foreground font-medium")}>
                               {voucherFile ? voucherFile.name : 'Ningún archivo...'}
                             </span>
                          </div>
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="reference">Número de Referencia</Label>
                         <Input id="reference" placeholder="00012345" value={reference} onChange={(e) => setReference(e.target.value)} />
                       </div>
                     </div>
                     <Button onClick={handleConfirmAndActivate} disabled={!reference || !voucherFile || isSubmitting} className="w-full">
                       {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Handshake className="mr-2 h-4 w-4" />}
                       {isSubmitting ? 'Procesando...' : 'Confirmar y Activar'}
                    </Button>
                   </div>
              )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
