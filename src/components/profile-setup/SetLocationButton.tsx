
'use client';

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { MapPin } from "lucide-react";

export default function SetLocationButton() {
    const router = useRouter();

    const handleSetLocation = () => {
        router.push('/map?fromMap=true');
    };

    return (
        <Button variant="outline" size="icon" onClick={handleSetLocation}>
            <MapPin className="w-4 h-4"/>
        </Button>
    );
}
