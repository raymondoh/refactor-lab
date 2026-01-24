// // src/components/marketing/featured-tradespeople-carousel.tsx
// "use client";

// import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
// import { TradespersonCard } from "@/components/cards/tradesperson-card";
// import type { User } from "@/lib/types/user";

// interface FeaturedTradespeopleCarouselProps {
//   tradespeople: User[];
// }

// export function FeaturedTradespeopleCarousel({ tradespeople }: FeaturedTradespeopleCarouselProps) {
//   // Because this is a client component, it and all its children (including FavoriteButton)
//   // will have access to client-side context like the SessionProvider and SWR cache
//   // from the moment they hydrate, ensuring the correct favorite status is shown.
//   return (
//     <Carousel opts={{ align: "start", loop: true }} className="w-full">
//       <CarouselContent>
//         {tradespeople.map(tradesperson => (
//           <CarouselItem key={tradesperson.id} className="basis-4/5 md:basis-1/2 lg:basis-1/3">
//             <div className="p-1 h-full">
//               <TradespersonCard tradesperson={tradesperson} />
//             </div>
//           </CarouselItem>
//         ))}
//       </CarouselContent>
//       <CarouselPrevious className="hidden sm:flex" />
//       <CarouselNext className="hidden sm:flex" />
//     </Carousel>
//   );
// }
// src/components/marketing/featured-tradespeople-carousel.tsx
"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { TradespersonCard } from "@/components/cards/tradesperson-card";
import type { User } from "@/lib/types/user";

interface FeaturedTradespeopleCarouselProps {
  tradespeople: User[];
}

export function FeaturedTradespeopleCarousel({ tradespeople }: FeaturedTradespeopleCarouselProps) {
  // Because this is a client component, it and all its children (including FavoriteButton)
  // will have access to client-side context like the SessionProvider and SWR cache
  // from the moment they hydrate, ensuring the correct favorite status is shown.
  return (
    <Carousel opts={{ align: "start", loop: true }} className="w-full">
      <CarouselContent>
        {tradespeople.map(tradesperson => (
          <CarouselItem key={tradesperson.id} className="basis-4/5 md:basis-1/3 lg:basis-1/3">
            <div className="h-full p-1">
              <TradespersonCard tradesperson={tradesperson} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
