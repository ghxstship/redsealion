/**
 * Print utility — creates a clean, print-optimized table in a hidden iframe.
 */

import type { EntityField } from './entity-fields';

interface PrintOptions {
  title: string;
  data: Record<string, unknown>[];
  fields: EntityField[];
  subtitle?: string;
}

export function printTable({ title, data, fields, subtitle }: PrintOptions): void {
  // Build HTML table
  const headerCells = fields.map((f) => `<th>${esc(f.label)}</th>`).join('');

  const bodyRows = data
    .map((row) => {
      const cells = fields
        .map((f) => {
          const val = row[f.key];
          if (val == null) return '<td>—</td>';
          if (Array.isArray(val)) return `<td>${esc(val.join(', '))}</td>`;
          if (f.type === 'currency' && typeof val === 'number') {
            return `<td class="num">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)}</td>`;
          }
          if (f.type === 'number' && typeof val === 'number') {
            return `<td class="num">${val.toLocaleString()}</td>`;
          }
          if (f.type === 'date' && typeof val === 'string') {
            const d = new Date(val);
            return `<td>${isNaN(d.getTime()) ? esc(String(val)) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>`;
          }
          return `<td>${esc(String(val))}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<title>${esc(title)}</title>
<style>
  @page {
    margin: 0.75in;
    @bottom-center { content: counter(page) " of " counter(pages); }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
  .header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #1a1a1a; }
  .header h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
  .header .meta { font-size: 10px; color: #666; display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; padding: 6px 8px; border-bottom: 1.5px solid #ccc; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e5e5; font-size: 11px; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:nth-child(even) { background: #fafafa; }
  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 9px; color: #999; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <h1>${esc(title)}</h1>
    <div class="meta">
      <span>${subtitle ? esc(subtitle) : `${data.length} records`}</span>
      <span>Exported ${timestamp}</span>
    </div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">FlyteDeck — Generated ${timestamp}</div>
</body>
</html>`;

  // Create hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for content to render then print
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  // Fallback for browsers that fire onload synchronously
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch {
      // ignore
    }
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { /* already removed */ }
    }, 1000);
  }, 500);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
