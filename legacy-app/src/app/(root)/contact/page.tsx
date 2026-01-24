import type { Metadata } from "next";

import { MapPin, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact MotoStix | Get in Touch",
  description: "Contact our team for questions about our products, orders, or custom designs"
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          {/* 2. Replace the old header div with the new component */}
          <PageHeader
            title="Contact Us"
            subtitle="Have questions or need assistance? We're here to help you with anything related to our products."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Get In Touch</h2>
                <p className="text-muted-foreground mb-6">
                  We aim to respond to all inquiries within 24 hours during business days. For immediate assistance,
                  please call our customer service line.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Our Location</p>
                    <p className="text-muted-foreground">123 Motorcycle Lane, Speed City, SC 12345</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p className="text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Email Address</p>
                    <p className="text-muted-foreground">info@motostix.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
            <div className="w-12 h-0.5 bg-primary mb-6"></div>
            <p className="text-muted-foreground text-center max-w-2xl">
              Find quick answers to common questions about our products and services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                question: "How long does shipping take?",
                answer:
                  "Standard shipping typically takes 3-5 business days within the continental US. International shipping may take 7-14 business days depending on the destination."
              },
              {
                question: "Are your stickers waterproof?",
                answer:
                  "Yes, all our stickers are made with premium vinyl that is waterproof, UV-resistant, and designed to withstand extreme weather conditions."
              },
              {
                question: "Can I request a custom design?",
                answer:
                  "We offer custom design services. Simply contact us with your requirements, and our design team will work with you to create your perfect sticker."
              },
              {
                question: "What is your return policy?",
                answer:
                  "We offer a 30-day satisfaction guarantee. If you're not completely satisfied with your purchase, please contact us for a return authorization."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-secondary/5 rounded-xl p-6 shadow-sm border border-border/40">
                <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
