/**
 * Terms & Conditions Document Template
 *
 * White-labeled master terms document. Renders all sections and
 * subsections from the TermsDocument record with org branding.
 */

import {
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
} from 'docx';

import type {
  Organization,
  TermsDocument,
} from '@/types/database';

import {
  brandFromOrg,
  heading,
  body,
  spacer,
  signatureBlock,
  buildSection,
  createDocument,
  packDocument,
  formatDate,
  type DocBrand,
} from '../engine';

// ---------------------------------------------------------------------------
// Public data interface
// ---------------------------------------------------------------------------

export interface TermsDocumentData {
  org: Organization;
  termsDocument: TermsDocument;
  clientCompanyName: string;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function coverPage(brand: DocBrand, data: TermsDocumentData): Paragraph[] {
  const { termsDocument } = data;
  const children: Paragraph[] = [];

  children.push(spacer(2400));

  // Logo
  if (brand.logoBuffer && brand.logoMime) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: brand.logoMime,
            data: brand.logoBuffer,
            transformation: { width: 200, height: 75 },
            altText: {
              title: brand.orgName,
              description: `${brand.orgName} logo`,
              name: 'cover-logo',
            },
          }),
        ],
      })
    );
    children.push(spacer(200));
  }

  // Org name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: brand.orgName.toUpperCase(),
          bold: true,
          font: brand.fontHeading,
          size: 48,
          color: brand.primaryColor,
        }),
      ],
    })
  );

  // Document type label
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'MASTER TERMS & CONDITIONS',
          bold: true,
          font: brand.fontHeading,
          size: 32,
          color: brand.secondaryColor,
        }),
      ],
    })
  );

  // Title / subtitle
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: termsDocument.title,
          font: brand.fontBody,
          size: 24,
          color: brand.secondaryColor,
        }),
      ],
    })
  );

  // Version
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Version ${termsDocument.version}`,
          font: brand.fontBody,
          size: 20,
          color: '71717A',
        }),
      ],
    })
  );

  // Effective date
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'Effective: ', bold: true, size: 20, color: brand.secondaryColor }),
        new TextRun({ text: formatDate(termsDocument.updated_at), size: 20 }),
      ],
    })
  );

  // Confidential notice
  children.push(spacer(600));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'CONFIDENTIAL & PROPRIETARY',
          bold: true,
          font: brand.fontHeading,
          size: 18,
          color: brand.accentColor,
        }),
      ],
    })
  );

  return children;
}

function tableOfContents(brand: DocBrand, data: TermsDocumentData): Paragraph[] {
  const children: Paragraph[] = [];

  children.push(heading('Table of Contents', 1));
  children.push(spacer(100));

  for (const section of data.termsDocument.sections) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `${section.number}. ${section.title}`,
            bold: true,
            size: 22,
            color: brand.primaryColor,
          }),
        ],
      })
    );

    if (section.subsections) {
      for (const sub of section.subsections) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: 480 },
            children: [
              new TextRun({
                text: `${sub.number} ${sub.title}`,
                size: 20,
                color: brand.secondaryColor,
              }),
            ],
          })
        );
      }
    }
  }

  return children;
}

function sectionContent(brand: DocBrand, data: TermsDocumentData): Paragraph[] {
  const children: Paragraph[] = [];

  for (const section of data.termsDocument.sections) {
    // Section heading
    children.push(heading(`${section.number}. ${section.title}`, 2));

    // Section body — split on double newlines to create separate paragraphs
    if (section.body) {
      const paragraphs = section.body.split(/\n\n+/);
      for (const para of paragraphs) {
        children.push(body(para.trim()));
      }
    }

    // Subsections
    if (section.subsections) {
      for (const sub of section.subsections) {
        children.push(heading(`${sub.number} ${sub.title}`, 3));

        if (sub.body) {
          const paragraphs = sub.body.split(/\n\n+/);
          for (const para of paragraphs) {
            children.push(body(para.trim()));
          }
        }
      }
    }
  }

  return children;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateTermsDocument(
  data: TermsDocumentData
): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);

  // --- Cover page (no header/footer) ---
  const coverSection = buildSection({
    brand,
    children: coverPage(brand, data),
    includeHeaderFooter: false,
  });

  // --- Table of contents ---
  const tocSection = buildSection({
    brand,
    children: tableOfContents(brand, data),
    documentTitle: 'Terms & Conditions',
  });

  // --- Sections content ---
  const contentSection = buildSection({
    brand,
    children: sectionContent(brand, data),
    documentTitle: 'Terms & Conditions',
  });

  // --- Signature / acceptance block ---
  const sigSection = buildSection({
    brand,
    children: signatureBlock(brand, data.clientCompanyName),
    documentTitle: 'Terms & Conditions',
  });

  // --- Assemble ---
  const doc = createDocument(brand, [
    coverSection,
    tocSection,
    contentSection,
    sigSection,
  ]);

  return packDocument(doc);
}
