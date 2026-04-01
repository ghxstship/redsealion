'use client';

import { useState } from 'react';

interface TermsSection {
  number: string;
  title: string;
  body: string;
}

const termsDocument = {
  id: 'terms_001',
  title: 'Standard Terms & Conditions',
  version: 3,
  status: 'active' as const,
  updated_at: '2026-03-15T00:00:00Z',
};

const sections: TermsSection[] = [
  {
    number: '1',
    title: 'Scope of Services',
    body: 'Producer agrees to provide experiential production services as described in the attached proposal, including but not limited to concept design, fabrication, technology integration, logistics, installation, staffing, and de-installation. All services shall be performed in a professional and workmanlike manner consistent with industry standards. Any modifications to the scope of work must be agreed upon in writing by both parties.',
  },
  {
    number: '2',
    title: 'Payment Terms',
    body: 'Client agrees to pay Producer in accordance with the payment schedule set forth in the proposal. Unless otherwise specified, a deposit of 50% of the total project value is due upon execution of this agreement, with the remaining balance due upon completion of installation. Late payments shall accrue interest at a rate of 1.5% per month. Producer reserves the right to suspend work if payments are more than 15 days past due.',
  },
  {
    number: '3',
    title: 'Intellectual Property',
    body: 'All original creative concepts, designs, and production materials created by Producer for Client shall become the property of Client upon full payment. Producer retains the right to use project images and descriptions in its portfolio and marketing materials unless otherwise agreed in writing. Pre-existing intellectual property of Producer shall remain the property of Producer and is licensed to Client solely for the purposes of the project.',
  },
  {
    number: '4',
    title: 'Cancellation & Rescheduling',
    body: 'Client may cancel or reschedule the project upon written notice to Producer. Cancellation more than 60 days prior to the activation date entitles Client to a refund of the deposit less expenses incurred. Cancellation within 60 days forfeits the deposit. Cancellation within 30 days requires payment of 75% of the total project value. Rescheduling is subject to availability and may incur additional costs for storage and re-coordination.',
  },
  {
    number: '5',
    title: 'Liability & Insurance',
    body: 'Producer shall maintain general commercial liability insurance with minimum coverage of $2,000,000 per occurrence during the term of the project. Producer shall not be liable for delays or failures in performance resulting from force majeure events including but not limited to acts of God, government restrictions, epidemics, or venue-related complications beyond reasonable control. Total liability shall not exceed the total project value.',
  },
];

export default function TermsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  function toggleSection(number: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return next;
    });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Terms & Conditions
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your standard terms document.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
            Edit
          </button>
          <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            New Version
          </button>
        </div>
      </div>

      {/* Document header card */}
      <div className="rounded-xl border border-border bg-white px-6 py-5 mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{termsDocument.title}</h2>
            <p className="mt-1 text-xs text-text-muted">
              Version {termsDocument.version} &middot; Updated {formatDate(termsDocument.updated_at)}
            </p>
          </div>
          <span className="inline-flex self-start items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Active
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.number);
          return (
            <div
              key={section.number}
              className="rounded-xl border border-border bg-white overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.number)}
                className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-bg-secondary/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-text-muted w-5 shrink-0">
                    {section.number}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {section.title}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="4 6 8 10 12 6" />
                </svg>
              </button>
              {!isExpanded && (
                <div className="px-6 pb-4 -mt-1">
                  <p className="text-xs text-text-muted line-clamp-2 pl-8">
                    {section.body}
                  </p>
                </div>
              )}
              {isExpanded && (
                <div className="px-6 pb-5 border-t border-border">
                  <p className="mt-4 text-sm text-text-secondary leading-relaxed pl-8">
                    {section.body}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
