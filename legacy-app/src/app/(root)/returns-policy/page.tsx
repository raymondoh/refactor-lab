import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { PageHeader } from "@/components/shared/PageHeader"; // Import your reusable component

export const metadata: Metadata = {
  title: `Returns & Refunds Policy | ${siteConfig.name}`,
  description: `Our returns and refunds policy provides detailed information about procedures for returning your order from ${siteConfig.name}. We offer a satisfaction guarantee.`,
  robots: {
    index: true,
    follow: true
  }
};

export default function ReturnsPolicyPage() {
  return (
    <main className="min-h-screen">
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <PageHeader title="Returns & Refunds" subtitle="Our policy on returns, refunds, and exchanges." />

          <article className="prose dark:prose-invert max-w-4xl mx-auto mt-12">
            <p className="lead">
              We want you to be completely satisfied with your purchase from MotoStix. If you are not happy with your
              order, you may return it for a refund or exchange subject to the terms below.
            </p>
            <p>Last updated: June 5, 2025</p>

            <h2>Our Return Policy</h2>
            <p>
              We offer a 30-day satisfaction guarantee. If 30 days have gone by since your purchase, unfortunately, we
              can’t offer you a refund or exchange.
            </p>
            <p>
              To be eligible for a return, your item must be unused and in the same condition that you received it. It
              must also be in the original packaging.
            </p>

            <h2>Return Process</h2>
            <p>To initiate a return, please follow these steps:</p>
            <ol>
              <li>
                Contact us at <strong>info@motostix.com</strong> with your order number and the reason for your return.
              </li>
              <li>
                Once your return is approved, we will provide you with a return authorization and shipping instructions.
              </li>
              <li>
                Package the item securely and ship it to the address we provide. Please note that you will be
                responsible for paying for your own shipping costs for returning your item.
              </li>
            </ol>

            <h2>Refunds</h2>
            <p>
              Once your return is received and inspected, we will send you an email to notify you that we have received
              your returned item. We will also notify you of the approval or rejection of your refund.
            </p>
            <p>
              If you are approved, then your refund will be processed, and a credit will automatically be applied to
              your original method of payment within a certain amount of days (typically 5-10 business days).
            </p>

            <h2>Non-Returnable Items</h2>
            <p>Several types of goods are exempt from being returned. These include:</p>
            <ul>
              <li>Custom-designed or personalized items.</li>
              <li>Gift cards.</li>
              <li>Sale or clearance items.</li>
            </ul>

            <h2>Exchanges</h2>
            <p>
              We only replace items if they are defective or damaged upon arrival. If you need to exchange it for the
              same item, send us an email at info@motostix.com and we will assist you with the process.
            </p>

            <h2>Contact Us</h2>
            <p>If you have any questions on how to return your item to us, contact us at info@motostix.com.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
