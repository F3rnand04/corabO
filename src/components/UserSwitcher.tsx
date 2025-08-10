
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCorabo } from "@/contexts/CoraboContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User as UserIcon, Building } from "lucide-react";
import Image from "next/image";

export function UserSwitcher() {
  const { currentUser, users, isLoadingAuth } = useCorabo();

  if (isLoadingAuth || !currentUser) {
    return (
        <div className="w-auto h-10 flex items-center gap-2">
            <Image src="https://i.postimg.cc/Wz1MTvWK/lg.png" alt="Corabo Logo" width={32} height={32} className="h-8 w-auto"/>
            <div className="hidden sm:block">
                <div className="h-4 w-20 bg-muted rounded-md animate-pulse"/>
                <div className="h-3 w-12 bg-muted rounded-md mt-1 animate-pulse"/>
            </div>
        </div>
    );
  }

  return (
    <Select value={currentUser.id} disabled>
      <SelectTrigger className="w-auto min-w-0 sm:min-w-[180px] h-10 gap-2 border-none focus:ring-0">
        <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
            <AvatarFallback>
                <UserIcon className="h-4 w-4" />
            </AvatarFallback>
        </Avatar>
        <SelectValue asChild>
          <div className="hidden sm:block">
            <p className="font-semibold text-sm truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.type}</p>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                     <AvatarImage src={user.profileImage} alt={user.name} />
                     <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.type}</p>
                </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
