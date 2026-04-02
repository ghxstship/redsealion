/**
 * FlyteDeck Document Engine
 *
 * White-label document generation core. All templates pull branding
 * from the organization's brand_config — no hardcoded company names,
 * colors, or logos. Data comes from canonical 3NF Supabase tables.
 *
 * Uses the `docx` npm library (v9.6+).
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
  LevelFormat,
  TabStopType,
  TabStopPosition,
  ExternalHyperlink,
} from 'docx';

import type { Organization, BrandConfig } from '@/types/database';

// ---------------------------------------------------------------------------
// Constants — US Letter, 1‑inch margins
// ---------------------------------------------------------------------------

/** DXA units per inch */
export const DXA_PER_INCH = 1440;
export const PAGE_WIDTH = 12240; // 8.5 in
export const PAGE_HEIGHT = 15840; // 11 in
export const MARGIN = DXA_PER_INCH; // 1 in
export const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 9360

const BORDER_LIGHT = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const BORDER_NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const BORDERS_LIGHT = {
  top: BORDER_LIGHT,
  bottom: BORDER_LIGHT,
  left: BORDER_LIGHT,
  right: BORDER_LIGHT,
};
const BORDERS_NONE = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_NONE,
  right: BORDER_NONE,
};

// ---------------------------------------------------------------------------
// Brand helpers
// ---------------------------------------------------------------------------

export interface DocBrand {
  orgName: string;
  primaryColor: string; // hex without #
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  fontHeading: string;
  fontBody: string;
  tagline?: string;
  footerText?: string;
  logoBuffer?: Buffer;
  logoMime?: 'png' | 'jpg';
  facilities?: Array<{ name: string; city: string; state: string }>;
}

/** Extract DocBrand from Organization record */
export function brandFromOrg(org: Organization, logoBuffer?: Buffer): DocBrand {
  const bc = org.brand_config ?? ({} as BrandConfig);
  return {
    orgName: org.name,
    primaryColor: (bc.primaryColor ?? '#18181B').replace('#', ''),
    secondaryColor: (bc.secondaryColor ?? '#3F3F46').replace('#', ''),
    accentColor: (bc.accentColor ?? '#2563EB').replace('#', ''),
    bgColor: (bc.backgroundColor ?? '#FFFFFF').replace('#', ''),
    fontHeading: bc.fontHeading ?? 'Arial',
    fontBody: bc.fontBody ?? 'Arial',
    tagline: bc.companyTagline,
    footerText: bc.footerText,
    logoBuffer,
    facilities: org.facilities?.map((f) => ({
      name: f.name,
      city: f.city,
      state: f.state,
    })),
  };
}

// ---------------------------------------------------------------------------
// Style factory — builds Document `styles` from brand
// ---------------------------------------------------------------------------

export function buildStyles(brand: DocBrand) {
  return {
    default: {
      document: {
        run: { font: brand.fontBody, size: 22, color: '27272A' }, // 11pt zinc-800
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 36, bold: true, font: brand.fontHeading, color: brand.primaryColor },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, font: brand.fontHeading, color: brand.primaryColor },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 24, bold: true, font: brand.fontHeading, color: brand.secondaryColor },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Numbering (bullets & numbered lists)
// ---------------------------------------------------------------------------

export function buildNumbering() {
  return {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: '\u25E6',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'numbers',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'checkboxes',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2610',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'checkboxes-checked',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2611',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Header & Footer builders
// ---------------------------------------------------------------------------

export function buildHeader(brand: DocBrand, documentTitle?: string): Header {
  const children: (TextRun | ImageRun)[] = [];

  if (brand.logoBuffer && brand.logoMime) {
    children.push(
      new ImageRun({
        type: brand.logoMime,
        data: brand.logoBuffer,
        transformation: { width: 80, height: 30 },
        altText: { title: brand.orgName, description: `${brand.orgName} logo`, name: 'logo' },
      })
    );
  }

  children.push(
    new TextRun({
      text: brand.orgName,
      bold: true,
      font: brand.fontHeading,
      size: 18,
      color: brand.primaryColor,
    })
  );

  if (documentTitle) {
    children.push(
      new TextRun({
        text: `\t${documentTitle}`,
        font: brand.fontBody,
        size: 16,
        color: brand.secondaryColor,
      })
    );
  }

  return new Header({
    children: [
      new Paragraph({
        children,
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: brand.primaryColor, space: 4 } },
        spacing: { after: 120 },
      }),
    ],
  });
}

export function buildFooter(brand: DocBrand): Footer {
  const locationText = brand.facilities?.map((f) => `${f.city}, ${f.state}`).join('  |  ') ?? '';
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: brand.footerText ?? brand.orgName,
            font: brand.fontBody,
            size: 14,
            color: brand.secondaryColor,
          }),
          ...(locationText
            ? [
                new TextRun({
                  text: `  |  ${locationText}`,
                  font: brand.fontBody,
                  size: 14,
                  color: '71717A',
                }),
              ]
            : []),
          new TextRun({
            text: '\tPage ',
            font: brand.fontBody,
            size: 14,
            color: '71717A',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: brand.fontBody,
            size: 14,
            color: '71717A',
          }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: brand.primaryColor, space: 4 } },
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Section builder — wraps children with header/footer/margins/page size
// ---------------------------------------------------------------------------

export interface SectionOptions {
  brand: DocBrand;
  children: Paragraph[] | (Paragraph | Table)[];
  documentTitle?: string;
  includeHeaderFooter?: boolean;
}

export function buildSection(opts: SectionOptions) {
  return {
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: opts.includeHeaderFooter !== false ? { default: buildHeader(opts.brand, opts.documentTitle) } : undefined,
    footers: opts.includeHeaderFooter !== false ? { default: buildFooter(opts.brand) } : undefined,
    children: opts.children,
  };
}

// ---------------------------------------------------------------------------
// Primitive builders
// ---------------------------------------------------------------------------

export function heading(text: string, level: 1 | 2 | 3 = 1): Paragraph {
  const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
  return new Paragraph({ heading: headingLevel, children: [new TextRun(text)] });
}

export function body(text: string, opts?: { bold?: boolean; italic?: boolean; color?: string; size?: number; spacing?: { before?: number; after?: number } }): Paragraph {
  return new Paragraph({
    spacing: opts?.spacing,
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        color: opts?.color,
        size: opts?.size,
      }),
    ],
  });
}

export function spacer(heightTwips = 200): Paragraph {
  return new Paragraph({ spacing: { before: heightTwips } });
}

export function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

export function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: [new TextRun(text)],
  });
}

export function numbered(text: string, ref = 'numbers', level = 0): Paragraph {
  return new Paragraph({
    numbering: { reference: ref, level },
    children: [new TextRun(text)],
  });
}

export function checkbox(text: string, checked = false): Paragraph {
  return new Paragraph({
    numbering: { reference: checked ? 'checkboxes-checked' : 'checkboxes', level: 0 },
    children: [new TextRun(text)],
  });
}

export function labelValue(label: string, value: string, brand?: DocBrand): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, color: brand?.secondaryColor ?? '3F3F46' }),
      new TextRun({ text: value, size: 20 }),
    ],
  });
}

export function calloutBox(text: string, brand: DocBrand, icon?: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: brand.accentColor, space: 8 },
    },
    indent: { left: 200 },
    children: [
      new TextRun({
        text: icon ? `${icon}  ${text}` : text,
        size: 20,
        italics: true,
        color: brand.secondaryColor,
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Table builders
// ---------------------------------------------------------------------------

export interface TableColumn {
  header: string;
  width: number; // DXA
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
}

export function dataTable(
  columns: TableColumn[],
  rows: string[][],
  brand: DocBrand
): Table {
  const headerCells = columns.map(
    (col) =>
      new TableCell({
        width: { size: col.width, type: WidthType.DXA },
        borders: BORDERS_LIGHT,
        shading: { fill: brand.primaryColor, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: col.align ?? AlignmentType.LEFT,
            children: [new TextRun({ text: col.header, bold: true, color: 'FFFFFF', size: 20, font: brand.fontHeading })],
          }),
        ],
      })
  );

  const dataRows = rows.map(
    (row, rowIdx) =>
      new TableRow({
        children: row.map(
          (cell, colIdx) =>
            new TableCell({
              width: { size: columns[colIdx].width, type: WidthType.DXA },
              borders: BORDERS_LIGHT,
              shading: rowIdx % 2 === 1 ? { fill: 'F4F4F5', type: ShadingType.CLEAR } : undefined,
              margins: { top: 40, bottom: 40, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: columns[colIdx].align ?? AlignmentType.LEFT,
                  children: [new TextRun({ text: cell, size: 20 })],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: columns.map((c) => c.width),
    rows: [new TableRow({ children: headerCells }), ...dataRows],
  });
}

/** Two-column key-value table (no header row) */
export function kvTable(
  pairs: Array<[string, string]>,
  brand: DocBrand,
  labelWidth = 3000
): Table {
  const valueWidth = CONTENT_WIDTH - labelWidth;
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [labelWidth, valueWidth],
    rows: pairs.map(
      ([label, value], idx) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: labelWidth, type: WidthType.DXA },
              borders: BORDERS_LIGHT,
              shading: { fill: 'F4F4F5', type: ShadingType.CLEAR },
              margins: { top: 40, bottom: 40, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, size: 20, color: brand.secondaryColor })],
                }),
              ],
            }),
            new TableCell({
              width: { size: valueWidth, type: WidthType.DXA },
              borders: BORDERS_LIGHT,
              margins: { top: 40, bottom: 40, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: value, size: 20 })] }),
              ],
            }),
          ],
        })
    ),
  });
}

// ---------------------------------------------------------------------------
// Signature block
// ---------------------------------------------------------------------------

export function signatureBlock(brand: DocBrand, clientCompanyName: string): (Paragraph | Table)[] {
  const colWidth = Math.floor(CONTENT_WIDTH / 2);
  const line = '________________________________';

  const sigTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [colWidth, colWidth],
    rows: [
      // Headers
      new TableRow({
        children: [
          new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            borders: BORDERS_NONE,
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'CLIENT', bold: true, size: 22, color: brand.primaryColor })],
              }),
            ],
          }),
          new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            borders: BORDERS_NONE,
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'PRODUCER', bold: true, size: 22, color: brand.primaryColor })],
              }),
            ],
          }),
        ],
      }),
      // Company
      ...['Company:', 'Signature:', 'Printed Name:', 'Title:', 'Date:'].map(
        (label) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: colWidth, type: WidthType.DXA },
                borders: BORDERS_NONE,
                margins: { top: 60, bottom: 20, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${label} `, size: 20, color: '52525B' }),
                      new TextRun({
                        text: label === 'Company:' ? clientCompanyName : line,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: colWidth, type: WidthType.DXA },
                borders: BORDERS_NONE,
                margins: { top: 60, bottom: 20, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${label} `, size: 20, color: '52525B' }),
                      new TextRun({
                        text: label === 'Company:' ? brand.orgName : line,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      ),
    ],
  });

  return [
    heading('Acceptance', 2),
    body(
      'By signing below, Client acknowledges review and acceptance of this document, including all terms, scope, and investment outlined herein.'
    ),
    spacer(200),
    sigTable,
  ];
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Document assembler — wraps content into a full Document and packs to Buffer
// ---------------------------------------------------------------------------

export async function packDocument(doc: Document): Promise<Buffer> {
  return (await Packer.toBuffer(doc)) as unknown as Buffer;
}

export function createDocument(
  brand: DocBrand,
  sections: ReturnType<typeof buildSection>[]
): Document {
  return new Document({
    styles: buildStyles(brand),
    numbering: buildNumbering(),
    sections,
  });
}

// ---------------------------------------------------------------------------
// Document type registry
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  'proposal',
  'terms',
  'invoice',
  'change-order',
  'budget-summary',
  'production-schedule',
  'bom',
  'asset-inventory',
  'punch-list',
  'load-in-strike',
  'crew-call-sheet',
  'wrap-report',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
