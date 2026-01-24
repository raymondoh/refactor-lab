// src/app/client-layout.tsx - New Client Component
"use client";

import { Suspense } from "react";
import { Header, FooterWrapper } from "@/components";
import { Providers } from "@/providers/SessionProvider";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { CartProvider } from "@/contexts/CartContext";
import { LikesProvider } from "@/contexts/LikesContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { SearchDataLoader } from "@/components/search/search-data-loader";
import { SearchModal } from "@/components/search/search-modal";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <SearchProvider>
        <CartProvider>
          <LikesProvider>
            {/* Search components */}
            <SearchDataLoader collections={["products"]} />
            <Suspense fallback={<div className="hidden">Loading search...</div>}>
              {" "}
              <SearchModal />{" "}
            </Suspense>

            {/* Main layout structure */}
            <Header />
            <div className="flex flex-col min-h-screen">
              <div className="flex-1">{children}</div>
              <FooterWrapper />
            </div>

            {/* Cart sidebar */}
            <CartSidebar />
          </LikesProvider>
        </CartProvider>
      </SearchProvider>
    </Providers>
  );
}
