"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Share2, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types/product";

interface ProductShareButtonProps {
  product: Product;
}

export function ProductShareButton({ product }: ProductShareButtonProps) {
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);

  // Check for Web Share API support on component mount (client-side only)
  useEffect(() => {
    // Use the 'in' operator to check for the 'share' property at runtime
    if ("share" in navigator) {
      setIsWebShareSupported(true);
    }
  }, []);

  // Quick Fix: Use only product.id as it's a guaranteed property.
  const productUrl = typeof window !== "undefined" ? `${window.location.origin}/products/${product.id}` : "";

  const handleNativeShare = async () => {
    if (!navigator.share) return; // Should not happen if button is shown, but a good guard

    const shareData = {
      title: product.name,
      text: `Check out this awesome sticker from MotoStix: ${product.name}`,
      url: productUrl
    };

    try {
      await navigator.share(shareData);
    } catch (err) {
      // User might have cancelled the share, so we can ignore the error
      console.error("Error sharing:", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="flex-1 hover:bg-secondary/60 py-5 w-full">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Only show the native share option if the browser supports it */}
        {isWebShareSupported && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 className="mr-2 h-4 w-4" />
            <span>Share...</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Copy Link</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
