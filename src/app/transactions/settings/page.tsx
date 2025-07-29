
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, FileUp, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCorabo } from '@/contexts/CoraboContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SettingsHeader() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-lg font-semibold">Ajustes de Registro</h1>
                    <div className="w-8"></div>
                </div>
            </div>
        </header>
    );
}

// Demo data simulating what we 'read' from the ID card
const MOCKED_ID_DATA = {
    name: "María Garcia",
    idNumber: "V-12.345.678",
    age: 30,
};


export default function TransactionsSettingsPage() {
    const { currentUser } = useCorabo();
    const { toast } = useToast();
    const [idImage, setIdImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVerificationError(null);
            const reader = new FileReader();
            reader.onload = (event) => {
                setIdImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleVerifyDocument = () => {
        if (!idImage) {
            toast({
                variant: 'destructive',
                title: 'No hay imagen',
                description: 'Por favor, sube una imagen de tu cédula para continuar.',
            });
            return;
        }

        setIsLoading(true);
        setVerificationError(null);

        // Simulate a delay for OCR processing
        setTimeout(() => {
            // In a real app, here you would call an OCR service and compare results.
            // For this demo, we compare against our mocked data.
            const isNameMatch = currentUser.name.trim().toLowerCase() === MOCKED_ID_DATA.name.trim().toLowerCase();
            
            if (isNameMatch) {
                // Success
                toast({
                    title: "¡Verificación Exitosa!",
                    description: "Tus datos han sido validados. Serás redirigido.",
                    className: "bg-green-100 border-green-300 text-green-800",
                });
                // Here you would typically activate the module and redirect
                // For now, we just show the success toast.
            } else {
                // Failure
                setVerificationError("Los datos del documento no coinciden con los de tu cuenta.");
            }
            setIsLoading(false);
        }, 2000);
    };

    return (
        <>
            <SettingsHeader />
            <main className="container py-8 max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Paso 1: Verificación de Identidad</CardTitle>
                        <CardDescription>
                            Para activar tu registro de transacciones, necesitamos verificar tu identidad. 
                            Por favor, sube una foto clara y legible de tu cédula de identidad.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div
                            className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 cursor-pointer hover:bg-muted/50 transition-colors relative"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {idImage ? (
                                <Image src={idImage} layout="fill" objectFit="contain" alt="Vista previa de la cédula" />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground">
                                    <FileUp className="w-12 h-12 mb-2" />
                                    <p className="font-semibold">Haz clic para subir una imagen</p>
                                    <p className="text-xs">Asegúrate de que sea clara y todos los datos sean legibles.</p>
                                </div>
                            )}
                        </div>

                        {verificationError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Verifica tu documento</AlertTitle>
                                <AlertDescription>
                                    <p className="mb-2">{verificationError}</p>
                                    <div className="text-xs p-2 bg-destructive/20 rounded-md">
                                        <p><strong>Nombre:</strong> {currentUser.name}</p>
                                        <p><strong>Cédula:</strong> V-20.123.456 (ejemplo)</p>
                                        <p><strong>Edad:</strong> 28 años (ejemplo)</p>
                                    </div>
                                    <p className="mt-2 text-xs">
                                        Si deseas modificar estos datos, contacta a soporte. Si no, por favor, introduce la cédula del propietario de la cuenta.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <Button 
                            className="w-full" 
                            size="lg" 
                            onClick={handleVerifyDocument}
                            disabled={isLoading || !idImage}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                "Verificar Documento"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
