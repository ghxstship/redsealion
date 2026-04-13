'use client';

import React, { useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// ─── Code 128B Barcode Encoder ────────────────────────────────────────────────
// Code 128B covers ASCII 32–127 which is sufficient for asset IDs and barcodes.

const CODE128B_START = 104;
const CODE128_STOP = 106;

// Each Code 128 symbol is 11 modules wide (except STOP which is 13).
// Patterns encoded as arrays of bar/space widths (bar first).
const PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
  [2,1,1,2,3,2],[2,3,3,1,1,1,2],
];

function encodeCode128B(text: string): number[] {
  const codes: number[] = [CODE128B_START];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code < 0 || code > 95) continue; // skip non-printable
    codes.push(code);
  }
  // checksum
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    sum += codes[i] * i;
  }
  codes.push(sum % 103);
  codes.push(CODE128_STOP);
  return codes;
}

function codesToBars(codes: number[]): boolean[] {
  const bars: boolean[] = [];
  for (const code of codes) {
    const pattern = PATTERNS[code];
    if (!pattern) continue;
    for (let i = 0; i < pattern.length; i++) {
      const isBar = i % 2 === 0;
      for (let j = 0; j < pattern[i]; j++) {
        bars.push(isBar);
      }
    }
  }
  return bars;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QRGeneratorProps {
  assetId: string;
  barcode: string;
  name: string;
}

export default function QRGenerator({ assetId, barcode, name }: QRGeneratorProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const barcodeValue = barcode || assetId;
  const codes = encodeCode128B(barcodeValue);
  const bars = codesToBars(codes);

  const moduleWidth = 1.5;
  const barHeight = 50;
  const svgWidth = bars.length * moduleWidth + 20; // 10px padding each side
  const svgHeight = barHeight + 10;

  const handlePrint = () => {
    const el = labelRef.current;
    if (!el) return;

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${name}</title>
          <style>
            body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
            .label { text-align: center; }
            .name { font-size: 11px; font-weight: 600; margin-bottom: 4px; }
            .barcode-text { font-size: 12px; font-family: monospace; letter-spacing: 1px; margin-top: 4px; }
            @media print {
              body { padding: 8px; }
            }
          </style>
        </head>
        <body>
          <div class="label">${el.innerHTML}</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card padding="sm" className="inline-block">
      <div ref={labelRef} className="text-center">
        <p className="text-xs font-semibold text-foreground mb-2 truncate max-w-[200px]">
          {name}
        </p>

        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="mx-auto"
        >
          {bars.map((isBar, i) =>
            isBar ? (
              <rect
                key={i}
                x={10 + i * moduleWidth}
                y={5}
                width={moduleWidth}
                height={barHeight}
                fill="#000"
              />
            ) : null,
          )}
        </svg>

        <p className="text-xs font-mono tracking-widest text-foreground mt-1">
          {barcodeValue}
        </p>
      </div>

      <Button
        onClick={handlePrint}
        className="mt-3 w-full px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-bg-secondary transition-colors"
      >
        Print Label
      </Button>
    </Card>
  );
}
