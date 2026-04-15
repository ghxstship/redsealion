/**
 * Terms & Conditions Document Template
 *
 * Generates a branded terms document with numbered sections,
 * version metadata, and acknowledgement signature block.
 */

import type { Organization, TermsDocument } from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  kvTable,
  signatureBlock,
  formatDate,
  pageBreak,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface TermsData {
  org: Organization;
  termsDocument: TermsDocument;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateTerms(data: TermsData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { termsDocument } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Cover Page
  // ------------------------------------------------------------------
  children.push(spacer(600));
  children.push(heading(termsDocument.title, 1));
  children.push(spacer(200));

  const metaInfo: Array<[string, string]> = [
    ['Version', String(termsDocument.version ?? 1)],
    ['Status', (termsDocument.status ?? 'draft').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Effective Date', formatDate(termsDocument.created_at)],
    ['Organization', data.org.name],
  ];

  children.push(kvTable(metaInfo, brand));
  children.push(pageBreak());

  // ------------------------------------------------------------------
  // 2. Table of Contents
  // ------------------------------------------------------------------
  const sections = (termsDocument.sections as Array<{ title: string; body: string; order?: number }>) ?? [];
  const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (sorted.length > 0) {
    children.push(heading('Table of Contents', 2));
    for (let i = 0; i < sorted.length; i++) {
      children.push(
        body(`${i + 1}. ${sorted[i].title}`, { size: 22, spacing: { after: 60 } }),
      );
    }
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 3. Sections
  // ------------------------------------------------------------------
  for (let i = 0; i < sorted.length; i++) {
    const section = sorted[i];
    children.push(heading(`${i + 1}. ${section.title}`, 2));

    // Split body by paragraphs for readability
    const paragraphs = section.body.split('\n').filter((p) => p.trim());
    for (const para of paragraphs) {
      children.push(body(para, { spacing: { after: 120 } }));
    }

    children.push(spacer(80));
  }

  // ------------------------------------------------------------------
  // 4. Acknowledgement Signature
  // ------------------------------------------------------------------
  children.push(pageBreak());
  children.push(heading('Acknowledgement', 2));
  children.push(
    body(
      'By signing below, the undersigned acknowledges that they have read, understood, and agree to be bound by the terms and conditions set forth in this document.',
      { spacing: { after: 200 } },
    ),
  );
  children.push(
    ...signatureBlock(
      [
        { role: 'Acknowledged By' },
        { role: 'Authorized Representative', name: data.org.name },
      ],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const docSection = buildSection({
    brand,
    children,
    documentTitle: 'Terms & Conditions',
  });

  const doc = createDocument(brand, [docSection]);
  return packDocument(doc);
}
