// components/Logo.tsx
"use client";

import Image from "next/image";

export function Logo({ className = "", ...props }) {
  return (
    <div className={`relative ${className}`} {...props}>
      {/* Light mode logo */}
      <Image
        src="/logo-light.svg"
        alt="App Logo"
        width={100}
        height={100}
        className="block dark:hidden h-full w-full object-contain"
        priority
      />
      {/* Dark mode logo */}
      <Image
        src="/logo-dark.svg"
        alt="App Logo"
        width={100}
        height={100}
        className="hidden dark:block h-full w-full object-contain"
        priority
      />
    </div>
  );
}
