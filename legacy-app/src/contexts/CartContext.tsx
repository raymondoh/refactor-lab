"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Product } from "@/types/product";

// Define cart item type
export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
};

// Define cart context type
type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
  itemCount: number;
  subtotal: number;
};

// Create context with default values
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

// Cart provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedCart = localStorage.getItem("motorstix-cart");
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
        localStorage.removeItem("motorstix-cart");
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("motorstix-cart", JSON.stringify(items));
    }
  }, [items, mounted]);

  // Calculate total item count
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // --- THIS IS THE FIX ---
  // Calculate subtotal, checking for a sale price on each item
  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.product.onSale && item.product.salePrice ? item.product.salePrice : item.product.price;
    return total + itemPrice * item.quantity;
  }, 0);
  // -------------------------

  // Add item to cart
  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...prevItems, { id: product.id, product, quantity }];
    });
    setIsOpen(true);
  }, []);

  // Remove item from cart
  const removeItem = useCallback((id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(id);
        return;
      }
      setItems(prevItems => prevItems.map(item => (item.id === id ? { ...item, quantity } : item)));
    },
    [removeItem]
  ); // removeItem is a dependency here

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Toggle cart visibility
  const toggleCart = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close cart
  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        toggleCart,
        closeCart,
        itemCount,
        subtotal
      }}>
      {children}
    </CartContext.Provider>
  );
}
