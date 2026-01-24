import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { PageHeader } from "@/components/shared/PageHeader"; // Import your reusable component

export const metadata: Metadata = {
  title: `Terms of Service | ${siteConfig.name}`,
  description: `Please read our Terms of Service carefully before using the ${siteConfig.name} website. This agreement sets forth the legally binding terms and conditions for your use of the site.`,
  robots: {
    index: true,
    follow: true
  }
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen">
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <PageHeader
            title="Terms of Service"
            subtitle={`By accessing or using our website, you agree to be bound by these terms.`}
          />

          <article className="prose dark:prose-invert max-w-4xl mx-auto mt-12">
            <p className="lead">
              Welcome to MotoStix! These Terms of Service ("Terms") govern your use of the website located at{" "}
              {siteConfig.url} (the "Site") and any related services provided by MotoStix ("we", "us", or "our").
            </p>
            <p>Last updated: June 5, 2025</p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing our Site and purchasing our products, you engage in our "Service" and agree to be bound by
              the following terms and conditions. These Terms apply to all users of the site, including without
              limitation users who are browsers, vendors, customers, merchants, and/ or contributors of content.
            </p>

            <h2>2. Products and Services</h2>
            <p>
              We make every effort to display as accurately as possible the colors and images of our products that
              appear at the store. We cannot guarantee that your computer monitor's display of any color will be
              accurate. We reserve the right to limit the quantities of any products or services that we offer. All
              descriptions of products or product pricing are subject to change at any time without notice, at our sole
              discretion.
            </p>

            <h2>3. Orders, Payment, and Billing</h2>
            <p>
              We reserve the right to refuse any order you place with us. By providing a payment method, you represent
              and warrant that you are authorized to use the designated payment method. You authorize us (or our
              third-party payment processor, Stripe) to charge your payment method for the total amount of your order
              (including any applicable taxes and shipping charges).
            </p>

            <h2>4. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive
              property of MotoStix and its licensors. Our trademarks and trade dress may not be used in connection with
              any product or service without the prior written consent of MotoStix. All sticker designs are copyright of
              MotoStix unless otherwise noted.
            </p>

            <h2>5. User Conduct</h2>
            <p>
              You agree not to use the Site for any unlawful purpose or any purpose prohibited under this clause. You
              agree not to use the Site in any way that could damage the Site, the Services, or the general business of
              MotoStix.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
              In no event shall MotoStix, nor its directors, employees, partners, agents, suppliers, or affiliates, be
              liable for any indirect, incidental, special, consequential or punitive damages, including without
              limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access
              to or use of or inability to access or use the Service.
            </p>

            <h2>7. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without
              regard to its conflict of law provisions.
            </p>

            <h2>8. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will notify
              you of any changes by posting the new Terms of Service on this page. You are advised to review these Terms
              periodically for any changes.
            </p>

            <h2>9. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at info@motostix.com.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
