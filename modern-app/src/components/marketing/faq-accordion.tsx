import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Container } from "../marketing/container";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionLPProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  faqs: FaqItem[];
}

export function FaqAccordion({
  title = "Frequently Asked Questions",
  description,
  eyebrow,
  faqs
}: FaqAccordionLPProps) {
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
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map(faq => (
              <AccordionItem key={faq.question} value={faq.question.replace(/\s+/g, "-").toLowerCase()}>
                <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
