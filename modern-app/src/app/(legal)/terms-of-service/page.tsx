// src/app/(legal)/terms-of-service/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Terms of Service | Plumbers Portal",
  description: "Read the terms and conditions for using the Plumbers Portal platform."
};

export default function TermsOfServicePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of Service | Plumbers Portal",
    dateModified: "2025-10-29",
    about: { "@type": "Organization", name: "Plumbers Portal" }
  };

  const heading1Style = "text-3xl font-bold tracking-tight mb-4 text-foreground";
  const heading2Style = "text-2xl font-semibold tracking-tight mt-8 mb-3 text-foreground";
  const paragraphStyle = "mb-4 text-base leading-relaxed text-muted-foreground";
  const listStyle = "list-disc pl-6 space-y-2 mb-4 text-muted-foreground";
  const linkStyle = "text-primary hover:underline";

  return (
    <section className="py-8 lg:py-12">
      <Container>
        <div className="mx-auto max-w-5xl space-y-4">
          <article>
            <h1 className={heading1Style}>Terms of Service</h1>
            <p className={`${paragraphStyle} text-sm`}>
              <em>Last updated: 29 October 2025</em>
            </p>

            <p className={paragraphStyle}>
              Welcome to Plumbers Portal. These Terms of Service (“Terms”) govern your access to and use of the Plumbers
              Portal website, platform, and related services (“Services”). By using our platform, you agree to these
              Terms and our{" "}
              <Link href="/privacy" className={linkStyle}>
                Privacy Policy
              </Link>
              . Please read them carefully before using the site.
            </p>

            <h2 className={heading2Style}>1. Definitions</h2>
            <p className={paragraphStyle}>
              <strong>“Customer”</strong> means a user seeking plumbing or maintenance work.{" "}
              <strong>“Tradesperson”</strong> means a professional or business providing such services.{" "}
              <strong>“User”</strong> refers to any person accessing the platform. <strong>“Platform”</strong> means the
              Plumbers Portal website, applications, and systems that facilitate connections and payments between
              Customers and Tradespeople.
            </p>

            <h2 className={heading2Style}>2. Account Use and Responsibilities</h2>
            <p className={paragraphStyle}>
              To use certain features, you must create an account and provide accurate, current, and complete
              information. You are responsible for maintaining your account credentials and all activity under your
              account. Users must be at least 18 years old and may not share login details with others.
            </p>
            <ul className={listStyle}>
              <li>Provide truthful and lawful information.</li>
              <li>Use the platform only for its intended purpose.</li>
              <li>Keep your account secure and notify us of any unauthorised access.</li>
            </ul>

            <h2 className={heading2Style}>3. User Conduct</h2>
            <p className={paragraphStyle}>
              Users agree not to use Plumbers Portal for unlawful, fraudulent, or abusive purposes. Harassment, hate
              speech, false information, or spamming are strictly prohibited. We reserve the right to suspend accounts
              engaged in misuse of the platform.
            </p>

            <h2 className={heading2Style}>4. Service Provision (for Customers and Tradespeople)</h2>
            <p className={paragraphStyle}>
              Plumbers Portal facilitates communication and transactions between Customers and independent Tradespeople.
              The platform allows Customers to post jobs, receive quotes, and manage payments securely. Tradespeople can
              create profiles, submit quotes, and accept work opportunities.
            </p>
            <p className={paragraphStyle}>
              Plumbers Portal does not provide plumbing or maintenance services directly. All services are performed by
              independent third-party Tradespeople.
            </p>

            <h2 className={heading2Style}>5. Marketplace Role & Liability</h2>
            <p className={paragraphStyle}>
              Plumbers Portal operates solely as an online marketplace connecting customers with independent
              tradespeople. We do not employ, endorse, or control any tradesperson listed on the platform, nor do we
              supervise or guarantee their work.
            </p>
            <p className={paragraphStyle}>
              Any agreement for work, including pricing, scope, and timeline, is made directly between the Customer and
              the Tradesperson. Plumbers Portal is not a party to these agreements and does not guarantee the quality,
              safety, or legality of services performed.
            </p>
            <p className={paragraphStyle}>
              Customers are responsible for verifying the credentials, qualifications, and insurance of any Tradesperson
              before hiring them. To the fullest extent permitted by law, Plumbers Portal shall not be liable for any
              loss, damage, injury, or claim arising from services provided by a Tradesperson or from any contract
              entered into between a Customer and a Tradesperson.
            </p>

            <h2 className={heading2Style}>6. Payments, Fees, and Refunds</h2>
            <p className={paragraphStyle}>
              Payments made through Plumbers Portal are processed via secure third-party providers such as Stripe.
              Deposit and final payment structures are agreed upon between the Customer and the Tradesperson, subject to
              our platform rules. Fees for premium features or subscriptions are detailed on the{" "}
              <Link href="/pricing" className={linkStyle}>
                Pricing
              </Link>{" "}
              page. Refunds or disputes will be handled in accordance with our{" "}
              <Link href="/resources/payments-and-disputes" className={linkStyle}>
                Payments & Disputes
              </Link>{" "}
              policy.
            </p>

            <h2 className={heading2Style}>7. Intellectual Property</h2>
            <p className={paragraphStyle}>
              All content, design, and branding on Plumbers Portal are owned by or licensed to us. Users retain rights
              to content they submit (such as profile images or descriptions) but grant Plumbers Portal a limited
              licence to display such content for promotional or operational purposes.
            </p>

            <h2 className={heading2Style}>8. Disclaimers and Limitation of Liability</h2>
            <p className={paragraphStyle}>
              The platform is provided “as is” and “as available.” We make no warranty that the Services will be
              uninterrupted, error-free, or fit for a particular purpose. To the maximum extent permitted by law,
              Plumbers Portal shall not be liable for any indirect, incidental, or consequential damages arising out of
              your use of the platform.
            </p>

            <h2 className={heading2Style}>9. Termination</h2>
            <p className={paragraphStyle}>
              We may suspend or terminate access to your account if you violate these Terms or misuse the platform. You
              may close your account at any time by contacting{" "}
              <Link href="/contact" className={linkStyle}>
                support
              </Link>
              . Any outstanding payments or disputes will survive termination.
            </p>

            <h2 className={heading2Style}>10. Governing Law</h2>
            <p className={paragraphStyle}>
              These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any
              dispute shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>

            <h2 className={heading2Style}>11. Changes to Terms</h2>
            <p className={paragraphStyle}>
              Plumbers Portal may update these Terms from time to time. We will notify users by updating the “Last
              Updated” date and, where appropriate, by email or in-app notice. Continued use of the platform after
              changes take effect constitutes acceptance of the revised Terms.
            </p>

            <h2 className={heading2Style}>12. Contact Information</h2>
            <p className={paragraphStyle}>
              For questions regarding these Terms, please contact us via our{" "}
              <Link href="/contact" className={linkStyle}>
                contact form
              </Link>{" "}
              or email us at{" "}
              <a href="mailto:support@plumbersportal.com" className={linkStyle}>
                support@plumbersportal.com
              </a>
              .
            </p>
          </article>

          <JsonLd data={jsonLd} />
        </div>
      </Container>
    </section>
  );
}
