"use client";

// src/components/providers/firebase-auth-provider.tsx
import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { ensureFirebaseAuth } from "@/lib/firebase/client";
import { logger } from "@/lib/logger";

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const syncAuth = async () => {
      try {
        await ensureFirebaseAuth();
      } catch (error) {
        logger.error("FirebaseAuthProvider: Failed to ensure Firebase auth", error);
      }
    };

    void syncAuth();
  }, [session?.user?.id]);

  return <>{children}</>;
}

export default FirebaseAuthProvider;
