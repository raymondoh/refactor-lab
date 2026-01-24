import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: `Shipping Policy | ${siteConfig.name}`,
  description: `Information about our order processing, shipping rates, delivery estimates, and tracking for all orders from ${siteConfig.name}.`,
  robots: {
    index: true,
    follow: true
  }
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen">
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <PageHeader
            title="Shipping Policy"
            subtitle="Everything you need to know about how we get your MotoStix to you."
          />

          <article className="prose dark:prose-invert max-w-4xl mx-auto mt-12">
            <p className="lead">
              Thank you for visiting and shopping at MotoStix. The following are the terms and conditions that
              constitute our Shipping Policy.
            </p>
            <p>Last updated: June 5, 2025</p>

            <h2>Order Processing Time</h2>
            <p>
              All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or
              holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please
              allow additional days in transit for delivery. If there will be a significant delay in the shipment of
              your order, we will contact you via email.
            </p>

            <h2>Shipping Rates & Delivery Estimates</h2>
            <p>
              Shipping charges for your order will be calculated and displayed at checkout. Delivery estimates are as
              follows:
            </p>
            <table>
              <thead>
                <tr>
                  <th>Shipment Method</th>
                  <th>Estimated Delivery Time</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Royal Mail Standard (UK)</td>
                  <td>3-5 business days</td>
                  <td>£3.99</td>
                </tr>
                <tr>
                  <td>Royal Mail Express (UK)</td>
                  <td>1-2 business days</td>
                  <td>£6.99</td>
                </tr>
                <tr>
                  <td>International Standard</td>
                  <td>7-16 business days</td>
                  <td>£12.99</td>
                </tr>
              </tbody>
            </table>
            <p>Please note that delivery delays can occasionally occur.</p>

            <h2>Shipment Confirmation & Order Tracking</h2>
            <p>
              You will receive a Shipment Confirmation email once your order has shipped containing your tracking
              number(s). The tracking number will be active within 24 hours.
            </p>

            <h2>Customs, Duties, and Taxes</h2>
            <p>
              MotoStix is not responsible for any customs and taxes applied to your order. All fees imposed during or
              after shipping are the responsibility of the customer (tariffs, taxes, etc.). This applies to
              international orders.
            </p>

            <h2>Damages</h2>
            <p>
              MotoStix is not liable for any products damaged or lost during shipping. If you received your order
              damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and
              damaged goods before filing a claim.
            </p>

            <h2>Returns Policy</h2>
            <p>
              Our <Link href="/returns-policy">Return & Refund Policy</Link> provides detailed information about options
              and procedures for returning your order.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
