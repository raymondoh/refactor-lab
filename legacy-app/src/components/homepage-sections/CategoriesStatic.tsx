import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryImage } from "./CategoryImage";
import { SectionHeader } from "../shared/SectionHeader";
import { homepageFeaturedCategories } from "@/config/homepage-categories";

export function CategoriesStatic() {
  return (
    <section className="py-16 w-full bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Shop By Category"
          description="Browse our extensive collection of high-quality decals and stickers for every type of motorcycle and vehicle."
          viewAllUrl="/products"
          viewAllText="View All Categories"
          centered={false}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {homepageFeaturedCategories.map(category => (
            <Link href={`/products?category=${category.id}`} key={category.id}>
              <Card className="border-none overflow-hidden transition-all duration-300 hover:shadow-sm hover:border-primary/20 group h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <CategoryImage
                    src={category.image || `/placeholder.svg?height=400&width=600&query=${category.name}+sticker`}
                    alt={category.name}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{category.name}</h3>
                    <span className="text-sm px-2 py-1 rounded-full bg-secondary/10 text-primary font-medium">
                      {category.count}+
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
