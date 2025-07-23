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
import { User as UserIcon } from "lucide-react";

export function UserSwitcher() {
  const { currentUser, users, switchUser } = useCorabo();

  return (
    <Select value={currentUser.id} onValueChange={switchUser}>
      <SelectTrigger className="w-auto min-w-[180px] h-10 gap-2 border-none focus:ring-0">
        <Avatar className="h-8 w-8">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={currentUser.name} />
            <AvatarFallback>
                <UserIcon className="h-4 w-4" />
            </AvatarFallback>
        </Avatar>
        <SelectValue placeholder="Seleccionar usuario" />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                     <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
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
