"use client";

import { Suspense } from "react";
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
              <SearchModal />
            </Suspense>

            {/* IMPORTANT: No Header/Footer here */}
            {children}

            {/* Cart sidebar */}
            <CartSidebar />
          </LikesProvider>
        </CartProvider>
      </SearchProvider>
    </Providers>
  );
}
