
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User as UserType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface CompanyCardProps {
    company: UserType;
}

export function CompanyCard({ company }: CompanyCardProps) {
    const profileLink = `/companies/${company.id}`;

    return (
        <Link href={profileLink} passHref>
            <Card className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-2 flex flex-col items-center text-center">
                    <Avatar className="w-16 h-16 border-2 border-primary mb-2">
                        <AvatarImage src={company.profileImage} alt={company.name} />
                        <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm truncate w-full">{company.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{company.reputation}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
