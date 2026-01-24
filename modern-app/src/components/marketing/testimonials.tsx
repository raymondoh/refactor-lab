import { Container } from "./container";

interface Testimonial {
  quote: string;
  name: string;
  role?: string;
}

interface TestimonialsLPProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  testimonials: Testimonial[];
}

export function Testimonials({
  title = "Trusted by homeowners and pros",
  description,
  eyebrow,
  testimonials
}: TestimonialsLPProps) {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="mx-auto mb-16 max-w-3xl text-center space-y-4">
          {eyebrow ? (
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</span>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          {description ? <p className="text-base text-muted-foreground">{description}</p> : null}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map(testimonial => (
            <figure
              key={testimonial.name}
              className="flex h-full flex-col justify-between rounded-2xl border bg-card p-6 shadow-sm">
              <blockquote className="text-sm leading-relaxed text-muted-foreground">“{testimonial.quote}”</blockquote>
              <figcaption className="mt-6 text-sm font-medium">
                <div>{testimonial.name}</div>
                {testimonial.role ? <div className="text-xs text-muted-foreground">{testimonial.role}</div> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
