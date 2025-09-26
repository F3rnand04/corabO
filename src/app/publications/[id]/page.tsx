
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-provider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { PublicationComments } from '@/components/PublicationComments';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; // Correctly import getDoc
import type { GalleryImage, User } from '@/lib/types';
import { PublicationCard } from '@/components/PublicationCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateGalleryImage, removeGalleryImage } from '@/lib/actions/publication.actions';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-client';


function EditPublicationDialog({ publication, onOpenChange }: { publication: GalleryImage, onOpenChange: (open: boolean) => void }) {
    const [description, setDescription] = useState(publication.description);
    const { toast } = useToast();

    const handleSave = async () => {
        try {
            await updateGalleryImage(publication.id, { description });
            toast({ title: 'Publicación Actualizada' });
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la publicación.' });
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Descripción</DialogTitle>
                <DialogDescription>
                    Realiza los cambios que necesites en la descripción de tu publicación.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Cambios</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function PublicationPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const [publication, setPublication] = useState<GalleryImage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { toast } = useToast();

    const publicationId = params.id as string;

    useEffect(() => {
        if (!publicationId || !db) {
            setIsLoading(false);
            return;
        }

        const unsub = onSnapshot(doc(db, 'publications', publicationId), async (docSnap) => {
            if (docSnap.exists()) {
                const pubData = docSnap.data() as GalleryImage;
                
                if (pubData.owner) {
                    setPublication(pubData);
                } else {
                     try {
                        // Use the modern getDoc function with the document reference
                        const ownerDocRef = doc(db, 'users', pubData.providerId);
                        const ownerDocSnap = await getDoc(ownerDocRef);
                        
                        if (ownerDocSnap.exists()) {
                            setPublication({ ...pubData, owner: ownerDocSnap.data() as User });
                        }
                    } catch(e) {
                         console.error("Failed to fetch owner document:", e);
                    }
                }
            } else {
                setPublication(null);
            }
             setIsLoading(false);
        });

        return () => unsub();

    }, [publicationId]);

    const handleDelete = async () => {
        if (!publication || !currentUser) return;
        try {
            await removeGalleryImage(currentUser.id, publication.id);
            toast({ title: 'Publicación Eliminada' });
            router.push('/profile');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la publicación.' });
        }
    };

    const isOwner = currentUser?.id === publication?.providerId;

    if (isLoading) {
        return (
            <main className="container max-w-2xl mx-auto py-4 space-y-4">
                <Skeleton className="h-[600px] w-full" />
            </main>
        );
    }

    if (!publication) {
        return (
             <main className="container max-w-2xl mx-auto py-12 text-center">
                <h2 className="text-2xl font-bold">Publicación no encontrada</h2>
                <p className="text-muted-foreground mt-2">El contenido que buscas no existe o ha sido eliminado.</p>
             </main>
        );
    }

    return (
        <div className="bg-muted/30 min-h-screen">
             <div className="fixed top-4 left-4 z-20 flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-background/50 rounded-full">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
             </div>
             
             {isOwner && (
                <div className="fixed top-4 right-4 z-20 flex gap-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="bg-background/80 rounded-full">
                                <Edit className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <EditPublicationDialog publication={publication} onOpenChange={setIsEditDialogOpen} />
                    </Dialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" size="icon" className="bg-background/80 rounded-full">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar esta publicación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción es permanente y no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
             )}

            <main className="container max-w-2xl mx-auto py-4">
               <PublicationCard publication={publication} />
               {publication.owner && (
                 <div className="bg-background p-4 rounded-b-lg border-x border-b">
                   <PublicationComments publicationId={publicationId} ownerId={publication.owner.id} />
                 </div>
               )}
            </main>
        </div>
    );
}
