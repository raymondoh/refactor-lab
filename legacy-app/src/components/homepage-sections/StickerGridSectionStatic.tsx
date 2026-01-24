import Link from "next/link";
import { CategoryImage } from "./CategoryImage";
import { SectionHeader } from "../shared/SectionHeader";
import { stickerGridSections } from "@/config/homepage-categories";

export default function StickerGridSectionsStatic() {
  const { carSection, bikeSection, customSection, vintageSection } = stickerGridSections;

  return (
    <section className="py-16 w-full bg-secondary/5">
      <div className="container mx-auto px-4 space-y-24">
        {/* First Grid Section - Style Your Ride */}
        <div>
          <SectionHeader
            title="Style Your Ride"
            description="Express your personality with our premium quality stickers designed for cars and bikes."
            viewAllUrl="/products?category=cars,motorbikes"
            viewAllText="Shop Vehicle Stickers"
            centered={false}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Car with sticker image */}
            <div className="rounded-xl overflow-hidden bg-background relative group h-64 md:h-72 shadow-sm">
              <div className="relative w-full h-full">
                <CategoryImage
                  src={carSection.image}
                  alt="Car with sticker"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <h3 className="text-white text-xl font-bold">Car Stickers</h3>
                <Link
                  href={carSection.url}
                  className="text-white/80 hover:text-white text-sm inline-flex items-center mt-1">
                  Shop Now <span className="ml-1">→</span>
                </Link>
              </div>
            </div>

            {/* Sticker-like div */}
            <div className="rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center p-6 transform rotate-1 hover:rotate-0 transition-all duration-300 h-64 md:h-72 shadow-sm">
              <p className="text-white text-3xl md:text-4xl font-bold text-center leading-tight">I ❤️ My Car</p>
            </div>

            {/* Bike with sticker image */}
            <div className="rounded-xl overflow-hidden bg-background relative group h-64 md:h-72 shadow-sm">
              <div className="relative w-full h-full">
                <CategoryImage
                  src={bikeSection.image}
                  alt="Bike with sticker"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <h3 className="text-white text-xl font-bold">Bike Stickers</h3>
                <Link
                  href={bikeSection.url}
                  className="text-white/80 hover:text-white text-sm inline-flex items-center mt-1">
                  Shop Now <span className="ml-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Second Grid Section - Express Yourself */}
        <div>
          <SectionHeader
            title="Express Yourself"
            description="Find the perfect design to showcase your unique style and personality."
            viewAllUrl="/products?designThemes=Custom,Vintage,Graffiti"
            viewAllText="Browse All Designs"
            centered={false}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Sticker-like div */}
            <div className="md:col-span-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center p-8 transform -rotate-1 hover:rotate-0 transition-all duration-300 h-80 shadow-sm">
              <p className="text-white text-3xl md:text-4xl font-bold text-center leading-tight">Born to Ride 🏍️</p>
            </div>

            {/* Large bike image */}
            <div className="md:col-span-8 rounded-xl overflow-hidden bg-background relative h-80 group shadow-sm">
              <div className="relative w-full h-full">
                <CategoryImage
                  src={customSection.image}
                  alt="Custom bike stickers"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-xl font-bold">Custom Designs</h3>
                <Link
                  href={customSection.url}
                  className="text-white/80 hover:text-white text-sm inline-flex items-center mt-2">
                  Create Your Own <span className="ml-1">→</span>
                </Link>
              </div>
            </div>

            {/* Small car image */}
            <div className="md:col-span-6 rounded-xl overflow-hidden bg-background relative h-80 group shadow-sm">
              <div className="relative w-full h-full">
                <CategoryImage
                  src={vintageSection.image}
                  alt="Vintage car sticker"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-xl font-bold">Vintage Collection</h3>
                <Link
                  href={vintageSection.url}
                  className="text-white/80 hover:text-white text-sm inline-flex items-center mt-2">
                  Explore <span className="ml-1">→</span>
                </Link>
              </div>
            </div>

            {/* Sticker-like div */}
            <div className="md:col-span-6 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center p-8 transform rotate-1 hover:rotate-0 transition-all duration-300 h-80 shadow-sm">
              <p className="text-white text-3xl md:text-4xl font-bold text-center leading-tight">Drive Different 🚗</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
