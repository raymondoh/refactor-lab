"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function AuthModal({ children }: { children: React.ReactNode }) {
  const overlay = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.back();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === overlay.current) {
      router.back();
    }
  };

  return (
    <div
      ref={overlay}
      onClick={handleClick}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-full mx-auto rounded-lg bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-300">
        {children}
      </div>
    </div>
  );
}
