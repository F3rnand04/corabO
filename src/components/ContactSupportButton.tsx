'use client';

import { sendMessage } from "@/lib/actions/messaging.actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth-provider";

interface ContactSupportButtonProps {
    children: React.ReactNode;
}

export function ContactSupportButton({ children }: ContactSupportButtonProps) {
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleChatSupport = () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para contactar a soporte.' });
            return;
        }
        const conversationId = [currentUser.id, 'corabo-admin'].sort().join('-');
        sendMessage({ 
            recipientId: 'corabo-admin', 
            senderId: currentUser.id,
            conversationId,
            text: "Hola, necesito ayuda con la plataforma." 
        });
        router.push(`/messages/${conversationId}`);
    };

    return (
        <button onClick={handleChatSupport} className="text-primary underline hover:no-underline">
            {children}
        </button>
    );
}
