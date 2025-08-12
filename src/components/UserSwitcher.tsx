
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
  const { currentUser, users, isLoadingAuth, handleUserAuth } = useCorabo();

  if (isLoadingAuth || !users.length) {
    return (
        <div className="w-full h-10 flex items-center justify-center">
            <div className="h-4 w-28 bg-muted rounded-md animate-pulse"/>
        </div>
    );
  }

  const handleSwitchUser = (userId: string) => {
    const userToLogin = users.find(u => u.id === userId);
    if(userToLogin) {
      // This is a mock login for development, it directly sets the user.
      // The `handleUserAuth` from the context will set the state.
      // We are passing a mock FirebaseUser object.
      handleUserAuth({
          uid: userToLogin.id,
          displayName: userToLogin.name,
          email: userToLogin.email,
          photoURL: userToLogin.profileImage,
          emailVerified: userToLogin.emailValidated,
      } as any);
    }
  }

  return (
    <Select onValueChange={handleSwitchUser}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Elegir usuario para simular..." />
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
