import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Privacy Policy | Plumbers Portal",
  description:
    "Learn how Plumbers Portal collects, uses, and protects your personal data in compliance with UK GDPR and the Data Protection Act 2018."
};

export default function PrivacyPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy | Plumbers Portal",
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
            <h1 className={heading1Style}>Privacy Policy</h1>
            <p className={`${paragraphStyle} text-sm`}>
              <em>Last updated: 29 October 2025</em>
            </p>

            <p className={paragraphStyle}>
              Plumbers Portal (“we”, “our”, “us”) is committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, and share your personal information in accordance with the UK General Data Protection
              Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>

            <h2 className={heading2Style}>1. Who We Are</h2>
            <p className={paragraphStyle}>
              <strong>Controller:</strong> Plumbers Portal Ltd (replace with your legal entity name and address). You
              can contact us via our{" "}
              <Link href="/contact" className={linkStyle}>
                contact form
              </Link>{" "}
              or email{" "}
              <a href="mailto:support@plumbersportal.com" className={linkStyle}>
                support@plumbersportal.com
              </a>
              .
            </p>

            <h2 className={heading2Style}>2. Information We Collect</h2>
            <ul className={listStyle}>
              <li>
                <strong>Account data:</strong> name, email, password (hashed), role, and contact details.
              </li>
              <li>
                <strong>Profile & verification:</strong> business name, qualifications, insurance documents,
                certifications, and profile photo.
              </li>
              <li>
                <strong>Job & quote data:</strong> job descriptions, messages, media uploads, quotes, and availability.
              </li>
              <li>
                <strong>Payments:</strong> processed securely via Stripe. We store reference IDs and metadata but never
                store full card details.
              </li>
              <li>
                <strong>Technical & usage data:</strong> IP address, device type, cookies, and usage logs for security
                and analytics.
              </li>
            </ul>

            <h2 className={heading2Style}>3. How We Use Your Data (Lawful Bases)</h2>
            <ul className={listStyle}>
              <li>
                <strong>To provide our service</strong> (contract): manage accounts, jobs, quotes, and payments.
              </li>
              <li>
                <strong>Verification & safety</strong> (legitimate interests/legal obligation): fraud checks, ID and
                insurance verification, and safety monitoring.
              </li>
              <li>
                <strong>Communications</strong> (contract/legitimate interests): service emails, job notifications, and
                receipts. Marketing is only sent with consent.
              </li>
              <li>
                <strong>Analytics & improvements</strong> (legitimate interests/consent): performance monitoring and
                product enhancements.
              </li>
            </ul>

            <h2 className={heading2Style}>4. Sharing Your Data</h2>
            <ul className={listStyle}>
              <li>
                <strong>With other users:</strong> job details and necessary profile info to enable quotes and bookings.
              </li>
              <li>
                <strong>Service providers:</strong> Stripe (payments), Firebase/Google Cloud (hosting & auth), and
                communication tools (e.g., Resend or Mailchimp) — all bound by Data Processing Agreements.
              </li>
              <li>
                <strong>Legal/compliance:</strong> when required by law, to prevent fraud, or to protect users and our
                platform.
              </li>
            </ul>

            <h2 className={heading2Style}>5. International Transfers</h2>
            <p className={paragraphStyle}>
              Where data is transferred outside the UK (e.g., to US-based processors like Stripe or Google), we rely on
              adequacy decisions or Standard Contractual Clauses with additional safeguards.
            </p>

            <h2 className={heading2Style}>6. Data Retention</h2>
            <p className={paragraphStyle}>
              We retain personal data only as long as necessary for the purposes described above — for example, for the
              lifetime of your account, or longer where required by financial or legal obligations (e.g., 6 years for
              tax records). You may request deletion of your account at any time.
            </p>

            <h2 className={heading2Style}>7. Your Rights</h2>
            <ul className={listStyle}>
              <li>Request access to your personal data (Subject Access Request).</li>
              <li>Request correction or deletion of inaccurate or outdated data.</li>
              <li>Request restriction or objection to certain processing activities.</li>
              <li>Withdraw consent where processing relies on consent (e.g., marketing).</li>
              <li>
                File a complaint with the{" "}
                <a href="https://ico.org.uk" target="_blank" rel="noreferrer" className={linkStyle}>
                  Information Commissioner’s Office (ICO)
                </a>
                .
              </li>
            </ul>

            <h2 className={heading2Style}>8. Security</h2>
            <p className={paragraphStyle}>
              We apply strong access controls, encryption in transit and at rest, two-factor authentication for admin
              systems, and regular audits. Tradesperson verification includes identity and insurance checks where
              applicable.
            </p>

            <h2 className={heading2Style}>9. Children’s Data</h2>
            <p className={paragraphStyle}>
              Plumbers Portal is not directed toward or intended for children under 16. We do not knowingly collect data
              from minors.
            </p>

            <h2 className={heading2Style}>10. Changes to This Policy</h2>
            <p className={paragraphStyle}>
              We may update this Privacy Policy as our services evolve. The updated version will be posted on this page
              with a new “Last Updated” date. If changes are significant, we’ll provide additional notice.
            </p>

            <h2 className={heading2Style}>11. Contact Us</h2>
            <p className={paragraphStyle}>
              For any questions about this Privacy Policy or how we handle your data, please contact us via our{" "}
              <Link href="/contact" className={linkStyle}>
                contact form
              </Link>{" "}
              or email{" "}
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
