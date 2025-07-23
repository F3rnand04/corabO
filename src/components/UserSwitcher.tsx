"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCorabo } from "@/contexts/CoraboContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { User as UserIcon } from "lucide-react";

export function UserSwitcher() {
  const { currentUser, users, switchUser } = useCorabo();

  return (
    <Select value={currentUser.id} onValueChange={switchUser}>
      <SelectTrigger className="w-auto min-w-[180px] h-10 gap-2">
        <Avatar className="h-6 w-6">
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
                <Avatar className="h-6 w-6">
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
