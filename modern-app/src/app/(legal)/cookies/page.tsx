import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Cookies & Tracking Policy | Plumbers Portal",
  description:
    "Learn how Plumbers Portal uses cookies and similar technologies to provide a secure, personalised experience in compliance with UK GDPR."
};

export default function CookiesPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Cookies & Tracking Policy | Plumbers Portal",
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
            <h1 className={heading1Style}>Cookies & Tracking Policy</h1>
            <p className={`${paragraphStyle} text-sm`}>
              <em>Last updated: 29 October 2025</em>
            </p>

            <p className={paragraphStyle}>
              This Cookies & Tracking Policy explains how Plumbers Portal (“we”, “our”, “us”) uses cookies and similar
              technologies to operate, secure, and improve our website and platform in compliance with the UK GDPR and
              the Privacy and Electronic Communications Regulations (PECR).
            </p>

            <h2 className={heading2Style}>1. What Are Cookies?</h2>
            <p className={paragraphStyle}>
              Cookies are small text files stored on your device when you visit a website. They help remember your
              preferences, enable functionality, and improve performance. Some cookies are essential for the website to
              function; others are used for analytics or marketing.
            </p>

            <h2 className={heading2Style}>2. Types of Cookies We Use</h2>
            <ul className={listStyle}>
              <li>
                <strong>Strictly Necessary Cookies:</strong> Required for core site functionality, such as logging in,
                managing sessions, and security checks. These cannot be disabled.
              </li>
              <li>
                <strong>Functional Cookies:</strong> Remember your preferences (like theme mode or form inputs) to
                improve user experience.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how visitors use our site (e.g., page views,
                navigation paths) using tools like Google Analytics or Firebase Analytics. Data is aggregated and
                anonymous.
              </li>
              <li>
                <strong>Marketing Cookies (optional):</strong> Used for remarketing or ad performance measurement. These
                are only enabled with your explicit consent.
              </li>
            </ul>

            <h2 className={heading2Style}>3. Managing Your Preferences</h2>
            <p className={paragraphStyle}>
              When you first visit our website, you may be asked to accept or reject non-essential cookies. You can also
              change your preferences at any time via your browser settings or through our in-app cookie banner (if
              available).
            </p>
            <p className={paragraphStyle}>
              To block or delete cookies, adjust your browser’s privacy controls. Please note that disabling some
              cookies may impact functionality.
            </p>

            <h2 className={heading2Style}>4. Third-Party Tools</h2>
            <p className={paragraphStyle}>
              We may use trusted analytics and service providers such as Google, Stripe, or Firebase to process limited
              technical data securely. These providers may set their own cookies or tracking pixels, subject to their
              own privacy policies:
            </p>
            <ul className={listStyle}>
              <li>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className={linkStyle}>
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className={linkStyle}>
                  Stripe Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className={linkStyle}>
                  Firebase Privacy Policy
                </a>
              </li>
            </ul>

            <h2 className={heading2Style}>5. Updates to This Policy</h2>
            <p className={paragraphStyle}>
              We may update this Cookies & Tracking Policy as our use of technology evolves. The updated version will be
              published here with a new “Last updated” date.
            </p>

            <h2 className={heading2Style}>6. Contact Us</h2>
            <p className={paragraphStyle}>
              For questions about cookies or data tracking, please contact us via our{" "}
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
