"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/utils/get-initials";
import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}

export function UserAvatar({ src, name, email, className }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const shouldShowFallback = !src || imageError;

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {shouldShowFallback ? (
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {name || email ? getInitials(name, email) : <User className="h-4 w-4 text-primary-foreground" />}
        </AvatarFallback>
      ) : (
        <div className="relative h-full w-full rounded-full overflow-hidden">
          <Image
            src={src || "/placeholder.svg"}
            alt={name || email || "User"}
            fill
            onError={() => setImageError(true)}
            className="object-cover bg-muted text-foreground"
            sizes="40px"
          />
        </div>
      )}
    </Avatar>
  );
}
