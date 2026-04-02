import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // PDF generation placeholder — requires a PDF library like @react-pdf/renderer,
  // puppeteer, or a third-party service.
  // For now, return a helpful response indicating the feature is planned.

  return NextResponse.json(
    {
      error: 'PDF export is not yet implemented',
      proposal_id: id,
      suggestion: 'Use the DOCX export endpoint at /api/proposals/[id]/export/docx',
    },
    { status: 501 }
  );
}
