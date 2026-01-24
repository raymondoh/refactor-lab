import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { PageHeader } from "@/components/shared/PageHeader"; // Import your reusable component

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `Learn how ${siteConfig.name} collects, uses, and protects your personal data. Our commitment to your privacy and data security.`,
  robots: {
    index: true, // It's good practice to allow search engines to index policy pages
    follow: true
  }
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen">
      <section className="py-16 w-full bg-background">
        <div className="container mx-auto px-4">
          <PageHeader
            title="Privacy Policy"
            subtitle={`Your privacy is important to us. This policy outlines how we handle your personal information.`}
          />

          {/* Use the 'prose' class for beautiful typography on long-form text content.
              You may need to install and configure the '@tailwindcss/typography' plugin.
              The 'prose-invert' class handles dark mode automatically.
          */}
          <article className="prose dark:prose-invert max-w-4xl mx-auto mt-12">
            <p className="lead">
              At MotoStix, accessible from {siteConfig.url}, one of our main priorities is the privacy of our visitors.
              This Privacy Policy document contains types of information that is collected and recorded by MotoStix and
              how we use it.
            </p>
            <p>Last updated: June 5, 2025</p>

            <h2>Information We Collect</h2>
            <p>
              The personal information that you are asked to provide, and the reasons why you are asked to provide it,
              will be made clear to you at the point we ask you to provide your personal information.
            </p>
            <ul>
              <li>
                <strong>Personal Data:</strong> When you make a purchase, create an account, or contact us, we may
                collect your name, email address, shipping address, billing address, and phone number.
              </li>
              <li>
                <strong>Payment Data:</strong> All payments are processed by Stripe. We do not store your full credit
                card number on our servers.
              </li>
              <li>
                <strong>Usage Data:</strong> We may automatically collect information about how you access and use the
                website, such as your IP address, browser type, pages visited, and the time and date of your visit.
              </li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect in various ways, including to:</p>
            <ul>
              <li>Provide, operate, and maintain our website</li>
              <li>Process your transactions and manage your orders</li>
              <li>Improve, personalize, and expand our website</li>
              <li>Understand and analyze how you use our website</li>
              <li>
                Communicate with you, either directly or through one of our partners, including for customer service, to
                provide you with updates and other information relating to the website, and for marketing and
                promotional purposes
              </li>
              <li>Send you emails</li>
              <li>Find and prevent fraud</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We use a variety of security measures to maintain the safety of your personal information when you place
              an order or enter, submit, or access your personal information. All payment transactions are processed
              through a gateway provider (Stripe) and are not stored or processed on our servers.
            </p>

            <h2>Your Data Protection Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul>
              <li>The right to access – You have the right to request copies of your personal data.</li>
              <li>
                The right to rectification – You have the right to request that we correct any information you believe
                is inaccurate.
              </li>
              <li>
                The right to erasure – You have the right to request that we erase your personal data, under certain
                conditions.
              </li>
              <li>
                The right to restrict processing – You have the right to request that we restrict the processing of your
                personal data, under certain conditions.
              </li>
            </ul>
            <p>To exercise any of these rights, please contact us at our provided email address.</p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at
              info@motostix.com.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
