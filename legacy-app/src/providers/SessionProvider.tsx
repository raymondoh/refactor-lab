"use client";
//import { connectFirebaseEmulator } from "@/firebase/connectEmulator";
import type React from "react";

//import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToasterProvider } from "@/providers/ToasterProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // useEffect(() => {
  //   connectFirebaseEmulator(); // ✅ Connect emulators when client loads
  // }, []);
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {/* <UserProvider> */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <ToasterProvider />
      </ThemeProvider>
      {/* </UserProvider> */}
    </SessionProvider>
  );
}
