import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import QuickQuoteBuilder from '@/components/admin/advances/QuickQuoteBuilder';

export const metadata = {
  title: 'Quick Quote Builder | Red Sea Lion',
};

export default function QuotePage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Quick Quote Builder"
        subtitle="Generate and draft proposals instantly using catalog intelligence."
      />
      <QuickQuoteBuilder />
    </div>
  );
}

