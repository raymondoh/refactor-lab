import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, Star, Phone } from "lucide-react";
import { Container } from "./container";

export default function WhyChooseUsSection() {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground">Why Choose Us?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We make it easy to connect customers with professionals, ensuring quality work and fair pricing.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center transition-transform hover:scale-105 bg-card">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <CardTitle>Verified Professionals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All plumbers are licensed, insured, and background-checked for your peace of mind.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center transition-transform hover:scale-105 bg-card">
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
              <CardTitle>24/7 Emergency Service</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with available plumbers anytime, because emergencies don't wait.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center transition-transform hover:scale-105 bg-card">
            <CardHeader>
              <Star className="h-10 w-10 text-primary mx-auto mb-4" />
              <CardTitle>Rated & Reviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Read real reviews from customers to make informed decisions about your plumber.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center transition-transform hover:scale-105 bg-card">
            <CardHeader>
              <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
              <CardTitle>Easy Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Request quotes and schedule appointments all in one place on our platform.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
