import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the FlyteDeck platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-24 lg:px-16">
      <div className="mx-auto max-w-2xl text-base leading-7 text-zinc-500">
        <p className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Terms of Service</h1>
        <p className="mt-6 text-xl leading-8">
          Please read these terms and conditions carefully before using FlyteDeck. By accessing or using our platform, you agree to be bound by these Terms of Service.
        </p>
        
        <div className="mt-10 max-w-2xl">
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-zinc-900">1. Acceptance of Terms</h2>
          <p className="mt-6">
            By accessing and using FlyteDeck (&ldquo;the Service&rdquo;), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by these terms, please do not use our service.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-zinc-900">2. Description of Service</h2>
          <p className="mt-6">
            FlyteDeck provides experiential production management software. We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-zinc-900">3. User Conduct and Account Security</h2>
          <p className="mt-6">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
          </p>
          <ul role="list" className="mt-8 max-w-xl space-y-4 text-zinc-500 list-disc pl-5">
            <li>Provide accurate, current, and complete information during registration.</li>
            <li>Promptly update your account information when changes occur.</li>
            <li>Maintain the security of your password and accept all risks of unauthorized access.</li>
          </ul>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-zinc-900">4. Intellectual Property Rights</h2>
          <p className="mt-6">
            The Service and its original content, features, and functionality are and will remain the exclusive property of FlyteDeck and its licensors. 
            Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of FlyteDeck.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-zinc-900">5. Limitation of Liability</h2>
          <p className="mt-6">
            In no event shall FlyteDeck, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-zinc-900">6. Modifications to Terms</h2>
          <p className="mt-6">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of significant changes to these Terms. Let us know if you have any questions at <a href="mailto:legal@flytedeck.io" className="text-zinc-900 underline hover:text-zinc-600">legal@flytedeck.io</a>.
          </p>
          
          <p className="mt-10 text-sm italic">Last Updated: April 8, 2026</p>
        </div>
      </div>
    </div>
  );
}
