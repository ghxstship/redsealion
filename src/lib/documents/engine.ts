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
} from 'docx';

import type { Organization } from '@/types/database';
import { castBrandConfig, castFacilities } from './json-casts';

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
  const bc = castBrandConfig(org.brand_config ?? null);
  const facs = castFacilities(org.facilities ?? null);
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
    facilities: facs.map((f) => ({
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
// Phase header block — styled "PHASE 01" label + title + rule + subtitle
// ---------------------------------------------------------------------------

export function phaseHeaderBlock(
  phaseNumber: string,
  title: string,
  subtitle: string | null,
  brand: DocBrand,
): Paragraph[] {
  const elements: Paragraph[] = [
    // Phase number label
    new Paragraph({
      spacing: { before: 480, after: 80 },
      children: [
        new TextRun({
          text: `PHASE ${phaseNumber.toString().padStart(2, '0')}`,
          font: brand.fontHeading,
          size: 18,
          bold: true,
          color: brand.accentColor,
          characterSpacing: 120,
        }),
      ],
    }),
    // Phase title
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: title,
          font: brand.fontHeading,
          size: 36,
          bold: true,
          color: brand.primaryColor,
        }),
      ],
    }),
    // Horizontal rule
    new Paragraph({
      spacing: { after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: brand.primaryColor },
      },
    }),
  ];

  // Subtitle
  if (subtitle) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: subtitle,
            font: brand.fontBody,
            size: 22,
            italics: true,
            color: brand.secondaryColor,
          }),
        ],
      }),
    );
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Narrative block — left-border indented storytelling paragraph
// ---------------------------------------------------------------------------

export function narrativeBlock(text: string, brand: DocBrand): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 200 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 8, color: brand.accentColor, space: 12 },
    },
    indent: { left: 200 },
    children: [
      new TextRun({
        text,
        size: 22,
        color: '3F3F46',
        font: brand.fontBody,
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Styled box — colored bordered container for callouts
// ---------------------------------------------------------------------------

export type BoxStyle = 'milestone' | 'terms' | 'addon' | 'info';

const BOX_COLORS: Record<BoxStyle, { border: string; bg: string; icon: string }> = {
  milestone: { border: '16A34A', bg: 'F0FDF4', icon: '🏁' },
  terms: { border: '7C3AED', bg: 'F5F3FF', icon: '⚖️' },
  addon: { border: 'D97706', bg: 'FFFBEB', icon: '⊕' },
  info: { border: '2563EB', bg: 'EFF6FF', icon: 'ℹ️' },
};

export function styledBox(
  title: string,
  bodyLines: string[],
  style: BoxStyle,
  brand: DocBrand,
): (Paragraph | Table)[] {
  const colors = BOX_COLORS[style];
  const elements: (Paragraph | Table)[] = [];

  // Wrapper using a single-cell table for the background + border effect
  const innerParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `${colors.icon}  ${title}`,
          font: brand.fontHeading,
          size: 24,
          bold: true,
          color: colors.border,
        }),
      ],
    }),
    ...bodyLines.map(
      (line) =>
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: line,
              size: 20,
              color: '3F3F46',
            }),
          ],
        }),
    ),
  ];

  elements.push(
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [CONTENT_WIDTH],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: CONTENT_WIDTH, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: colors.border },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: colors.border },
                left: { style: BorderStyle.SINGLE, size: 18, color: colors.border },
                right: { style: BorderStyle.SINGLE, size: 6, color: colors.border },
              },
              shading: { fill: colors.bg, type: ShadingType.CLEAR },
              margins: { top: 120, bottom: 120, left: 200, right: 200 },
              children: innerParagraphs,
            }),
          ],
        }),
      ],
    }),
  );

  return elements;
}

// ---------------------------------------------------------------------------
// Milestone gate box — green bordered with checkbox requirements + unlocks
// ---------------------------------------------------------------------------

export function milestoneGateBox(
  name: string,
  requirements: { text: string; assignee: string }[],
  unlocks: string | null,
  brand: DocBrand,
): (Paragraph | Table)[] {
  const lines: string[] = [];
  for (const req of requirements) {
    const assigneeLabel = req.assignee === 'client' ? ' [Client]' :
      req.assignee === 'both' ? ' [Both]' :
      req.assignee === 'external_vendor' ? ' [Vendor]' : '';
    lines.push(`☐  ${req.text}${assigneeLabel}`);
  }

  if (unlocks) {
    lines.push('');
    lines.push(`→ Unlocks: ${unlocks}`);
  }

  return styledBox(`MILESTONE GATE: ${name}`, lines, 'milestone', brand);
}

// ---------------------------------------------------------------------------
// Add-on table — amber styled rows with checkbox + description + cost
// ---------------------------------------------------------------------------

export function addOnTable(
  addons: Array<{ name: string; description: string; cost: string; selected: boolean; termsRef?: string }>,
  brand: DocBrand,
): Table {
  const checkWidth = 600;
  const nameWidth = 3000;
  const descWidth = CONTENT_WIDTH - checkWidth - nameWidth - 1800;
  const costWidth = 1200;
  const refWidth = 600;

  const amberBorder = { style: BorderStyle.SINGLE, size: 1, color: 'FDE68A' } as const;
  const amberBorders = { top: amberBorder, bottom: amberBorder, left: amberBorder, right: amberBorder };

  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: checkWidth, type: WidthType.DXA },
        borders: amberBorders,
        shading: { fill: 'FEF9C3', type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '✓', bold: true, size: 18, color: 'B45309' })] })],
      }),
      new TableCell({
        width: { size: nameWidth, type: WidthType.DXA },
        borders: amberBorders,
        shading: { fill: 'FEF9C3', type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: 'ADD-ON', bold: true, size: 18, color: 'B45309', font: brand.fontHeading })] })],
      }),
      new TableCell({
        width: { size: descWidth, type: WidthType.DXA },
        borders: amberBorders,
        shading: { fill: 'FEF9C3', type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: 'DESCRIPTION', bold: true, size: 18, color: 'B45309', font: brand.fontHeading })] })],
      }),
      new TableCell({
        width: { size: costWidth, type: WidthType.DXA },
        borders: amberBorders,
        shading: { fill: 'FEF9C3', type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'COST', bold: true, size: 18, color: 'B45309', font: brand.fontHeading })] })],
      }),
      new TableCell({
        width: { size: refWidth, type: WidthType.DXA },
        borders: amberBorders,
        shading: { fill: 'FEF9C3', type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '§', bold: true, size: 18, color: 'B45309', font: brand.fontHeading })] })],
      }),
    ],
  });

  const dataRows = addons.map(
    (addon) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: checkWidth, type: WidthType.DXA },
            borders: amberBorders,
            shading: addon.selected ? { fill: 'FEF3C7', type: ShadingType.CLEAR } : undefined,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: addon.selected ? '☑' : '☐', size: 22 })] })],
          }),
          new TableCell({
            width: { size: nameWidth, type: WidthType.DXA },
            borders: amberBorders,
            shading: addon.selected ? { fill: 'FEF3C7', type: ShadingType.CLEAR } : undefined,
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: addon.name, bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: descWidth, type: WidthType.DXA },
            borders: amberBorders,
            shading: addon.selected ? { fill: 'FEF3C7', type: ShadingType.CLEAR } : undefined,
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: addon.description, size: 20, color: '52525B' })] })],
          }),
          new TableCell({
            width: { size: costWidth, type: WidthType.DXA },
            borders: amberBorders,
            shading: addon.selected ? { fill: 'FEF3C7', type: ShadingType.CLEAR } : undefined,
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: addon.cost, bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: refWidth, type: WidthType.DXA },
            borders: amberBorders,
            shading: addon.selected ? { fill: 'FEF3C7', type: ShadingType.CLEAR } : undefined,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: addon.termsRef ?? '', size: 18, color: '7C3AED' })] })],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [checkWidth, nameWidth, descWidth, costWidth, refWidth],
    rows: [headerRow, ...dataRows],
  });
}

// ---------------------------------------------------------------------------
// Reference cards — 2-column layout for creative refs / portfolio
// ---------------------------------------------------------------------------

export function referenceCards(
  items: Array<{ label: string; description: string; type?: string }>,
  sectionTitle: string,
  brand: DocBrand,
  accentColor?: string,
): (Paragraph | Table)[] {
  const accent = accentColor ?? brand.accentColor;
  const elements: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: sectionTitle,
          font: brand.fontHeading,
          size: 24,
          bold: true,
          color: accent,
        }),
      ],
    }),
  ];

  // Create pairs for 2-column layout
  const colWidth = Math.floor(CONTENT_WIDTH / 2);
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];

    const cardBorder = { style: BorderStyle.SINGLE, size: 4, color: accent } as const;
    const cardBorders = { top: cardBorder, bottom: cardBorder, left: cardBorder, right: cardBorder };

    const makeCell = (item: typeof left | undefined) => {
      if (!item) {
        return new TableCell({
          width: { size: colWidth, type: WidthType.DXA },
          borders: BORDERS_NONE,
          children: [new Paragraph({})],
        });
      }
      return new TableCell({
        width: { size: colWidth, type: WidthType.DXA },
        borders: cardBorders,
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [
          ...(item.type
            ? [
                new Paragraph({
                  spacing: { after: 40 },
                  children: [
                    new TextRun({
                      text: item.type.toUpperCase(),
                      font: brand.fontHeading,
                      size: 14,
                      bold: true,
                      color: accent,
                      characterSpacing: 60,
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: item.label, bold: true, size: 20, color: brand.primaryColor }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: item.description, size: 18, color: '52525B' }),
            ],
          }),
        ],
      });
    };

    elements.push(
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [colWidth, colWidth],
        rows: [
          new TableRow({
            children: [makeCell(left), makeCell(right)],
          }),
        ],
      }),
    );

    // Small spacer between card rows
    if (i + 2 < items.length) {
      elements.push(spacer(80));
    }
  }

  return elements;
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
      ([label, value], _idx) =>
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
  // Library boundary cast: docx Packer.toBuffer() returns Uint8Array in v9.6+
  // but our API routes expect Node Buffer for Response construction.
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
  'packing-list',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
