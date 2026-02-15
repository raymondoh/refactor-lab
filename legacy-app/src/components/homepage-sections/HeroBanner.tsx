"use client";

import type React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface HeroBannerProps {
  className?: string;
}

export function HeroBanner({ className }: HeroBannerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section
      className={cn(
        "relative w-full h-[600px] md:h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden bg-background",
        className
      )}>
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="MotoStix - Premium Vehicle Stickers and Decals"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAPwCdABmX/9k="
        />
      </div>

      {/* Overlay (navy-toned, not pure black) */}
      {/* <div className="absolute inset-0 bg-background/20 dark:bg-black/50" /> */}
      <div className="absolute inset-0 bg-primary/10 dark:bg-black/50" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto pt-16 md:pt-0">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
          Premium Stickers for Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Adventures</span>
        </h1>

        <p className="text-base md:text-xl lg:text-2xl mb-6 md:mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
          Express yourself with premium quality, weather-resistant stickers designed for cars, motorcycles, and every
          journey.
        </p>

        {/* Search */}
        <div className="mt-6 md:mt-8 w-full max-w-2xl mx-auto mb-6 md:mb-8">
          <form
            onSubmit={handleSearch}
            className="flex overflow-hidden rounded-full bg-card/90 backdrop-blur-sm shadow-2xl border border-border/60">
            <div className="flex items-center pl-4 md:pl-6 pr-2 md:pr-3">
              <span className="rounded-md bg-muted px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-muted-foreground">
                Stickers
              </span>
            </div>

            <input
              type="text"
              placeholder="Search designs..."
              className="w-full py-3 md:py-4 px-3 md:px-4 text-foreground placeholder:text-muted-foreground outline-none bg-transparent text-base md:text-lg"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 px-4 md:px-6 text-primary-foreground transition-colors duration-200 flex items-center justify-center">
              <Search size={20} className="md:hidden" />
              <Search size={22} className="hidden md:block" />
            </button>
          </form>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 md:mt-12 flex flex-wrap justify-center items-center gap-4 md:gap-8 text-white/70 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Weather Resistant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span>Premium Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <span>Custom Designs</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-white/50">Photo by MotoStix</div>
    </section>
  );
}
