/**
 * Compliance Certificate Document Template
 *
 * Generates a branded compliance/COI certificate with verification
 * status, expiry tracking, and authorized signature.
 */

import type { Organization } from '@/types/database';

import {
  brandFromOrg,
  buildSection,
  createDocument,
  packDocument,
  heading,
  body,
  spacer,
  labelValue,
  calloutBox,
  kvTable,
  signatureBlock,
  formatDate,
} from '../engine';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

interface ComplianceCertificateData {
  org: Organization;
  document: {
    document_name: string;
    document_type: string;
    status: string;
    issued_to: string | null;
    issued_date: string | null;
    expiry_date: string | null;
    notes: string | null;
    verified_at: string | null;
  };
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateComplianceCertificate(data: ComplianceCertificateData): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const { document: doc } = data;

  const children: (import('docx').Paragraph | import('docx').Table)[] = [];

  // ------------------------------------------------------------------
  // 1. Header
  // ------------------------------------------------------------------
  children.push(spacer(400));
  children.push(heading('COMPLIANCE CERTIFICATE', 1));
  children.push(spacer(200));

  // ------------------------------------------------------------------
  // 2. Certificate Info
  // ------------------------------------------------------------------
  const metaInfo: Array<[string, string]> = [
    ['Document', doc.document_name],
    ['Type', doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Status', doc.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Issued To', doc.issued_to ?? '\u2014'],
    ['Issued Date', formatDate(doc.issued_date)],
    ['Expiry Date', formatDate(doc.expiry_date)],
  ];

  if (doc.verified_at) {
    metaInfo.push(['Verified On', formatDate(doc.verified_at)]);
  }

  children.push(kvTable(metaInfo, brand));
  children.push(spacer());

  // ------------------------------------------------------------------
  // 3. Status Notice
  // ------------------------------------------------------------------
  if (doc.status === 'verified') {
    children.push(
      calloutBox('This document has been verified and is currently in compliance.', brand),
    );
  } else if (doc.status === 'expired') {
    children.push(
      calloutBox('WARNING: This document has expired and requires renewal.', brand, '\u26A0'),
    );
  } else if (doc.status === 'rejected') {
    children.push(
      calloutBox('This document has been rejected. Please resubmit with corrections.', brand, '\u26A0'),
    );
  }
  children.push(spacer());

  // ------------------------------------------------------------------
  // 4. Expiry Warning
  // ------------------------------------------------------------------
  if (doc.expiry_date) {
    const expiry = new Date(doc.expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
      children.push(
        calloutBox(
          `Expires in ${daysUntilExpiry} day(s). Schedule renewal promptly.`,
          brand,
          '\u26A0',
        ),
      );
      children.push(spacer());
    }
  }

  // ------------------------------------------------------------------
  // 5. Notes
  // ------------------------------------------------------------------
  if (doc.notes) {
    children.push(heading('Notes', 2));
    children.push(body(doc.notes, { spacing: { after: 120 } }));
    children.push(spacer());
  }

  // ------------------------------------------------------------------
  // 6. Authorized Signature
  // ------------------------------------------------------------------
  children.push(heading('Certification', 2));
  children.push(
    body(
      'This certificate confirms that the above compliance documentation has been reviewed and is maintained in accordance with organizational policy.',
      { spacing: { after: 200 } },
    ),
  );
  children.push(
    ...signatureBlock(
      [{ role: 'Compliance Officer', name: data.org.name }],
      brand,
    ),
  );

  // ------------------------------------------------------------------
  // Assemble document
  // ------------------------------------------------------------------
  const section = buildSection({
    brand,
    children,
    documentTitle: 'Compliance Certificate',
  });

  const docResult = createDocument(brand, [section]);
  return packDocument(docResult);
}
