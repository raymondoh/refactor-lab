import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Sport Bike Enthusiast",
    content:
      "The quality of MotoStix decals is outstanding. They've lasted through all weather conditions and still look brand new after months of riding.",
    rating: 5
  },
  {
    id: 2,
    name: "Sarah Miller",
    role: "Cruiser Owner",
    content:
      "I've tried many brands, but MotoStix offers the best combination of durability and design. The colors are vibrant and application was super easy.",
    rating: 5
  },
  {
    id: 3,
    name: "Mike Thompson",
    role: "Off-Road Rider",
    content:
      "These stickers hold up incredibly well on my dirt bike. Even after muddy trails and pressure washing, they stay put and look great.",
    rating: 4
  }
];

export function TestimonialSection() {
  return (
    <section className="py-16 w-full bg-secondary/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">What Our Customers Say</h2>
          <div className="w-12 h-0.5 bg-primary mb-6"></div>
          <p className="text-muted-foreground text-center max-w-2xl">
            Don't just take our word for it - hear from riders who've transformed their bikes with our products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(testimonial => (
            <Card
              key={testimonial.id}
              className="border border-border hover:border-primary/20 transition-colors hover:shadow-sm h-full">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < testimonial.rating ? "text-primary" : "text-muted/20"}`}
                        fill={i < testimonial.rating ? "currentColor" : "none"}
                      />
                    ))}
                </div>
                <p className="mb-6 text-muted-foreground">{testimonial.content}</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-foreground font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
