import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FlyteDeck collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-base leading-7 text-text-secondary">
        <p className="text-base font-semibold leading-7 text-indigo-600">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
        <p className="mt-6 text-xl leading-8">
          At FlyteDeck, keeping your data secure and honoring your privacy is a top priority. This Privacy Policy outlines how we collect, use, and share your personal information.
        </p>
        
        <div className="mt-10 max-w-2xl">
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-foreground">1. Information We Collect</h2>
          <p className="mt-6">
            We collect information you provide directly to us, such as when you create or modify your account, use our services, contact customer support, or otherwise communicate with us. This information may include:
          </p>
          <ul role="list" className="mt-8 max-w-xl space-y-4 text-text-secondary">
            <li className="flex gap-x-3">
              <span><strong>Account Information:</strong> Name, email address, password, and organizational details.</span>
            </li>
            <li className="flex gap-x-3">
              <span><strong>Billing Information:</strong> Credit card details and billing address (processed securely by our payment providers, not stored on our servers).</span>
            </li>
            <li className="flex gap-x-3">
              <span><strong>Usage Data:</strong> Information about how you interact with our application, which helps us improve our services.</span>
            </li>
          </ul>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-foreground">2. How We Use Your Information</h2>
          <p className="mt-6">
            We use the information we collect to provide, maintain, and improve our services, including to:
          </p>
          <ul role="list" className="mt-8 max-w-xl space-y-4 text-text-secondary">
            <li>Process transactions and send related information.</li>
            <li>Send technical notices, updates, and security alerts.</li>
            <li>Respond to your comments, questions, and customer service requests.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
          </ul>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-foreground">3. Data Portability and Right to Erasure (GDPR/CCPA)</h2>
          <p className="mt-6">
            Depending on your location, you may have the right to request access to the personal information we hold about you, to port it to a new service, or to request that your personal information be corrected or deleted. 
            You can exercise these rights instantly via the <strong>Data & Privacy</strong> settings within the FlyteDeck application.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-foreground">4. Cookies and Tracking</h2>
          <p className="mt-6">
            We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent, and you may manage your cookie preferences through our Cookie Consent tool.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-foreground">5. Contact Us</h2>
          <p className="mt-6">
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@flytedeck.io" className="text-indigo-600 hover:text-indigo-500">privacy@flytedeck.io</a>.
          </p>
          
          <p className="mt-10 text-sm italic">Last Updated: April 8, 2026</p>
        </div>
      </div>
    </div>
  );
}
