import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { getESignProvider } from '@/lib/esign/provider';

export async function POST(request: Request) {
  try {
    const permResult = await checkPermission('proposals', 'edit');
    if (!permResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!permResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { organizationId } = permResult;
    const body = await request.json();
    const {
      proposal_id,
      document_type,
      document_title,
      signer_name,
      signer_email,
    } = body as {
      proposal_id: string;
      document_type: string;
      document_title: string;
      signer_name: string;
      signer_email: string;
    };

    if (!proposal_id || !document_type || !document_title || !signer_name || !signer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: proposal_id, document_type, document_title, signer_name, signer_email' },
        { status: 400 },
      );
    }

    // Look up the org slug for URL generation
    const supabase = await createClient();
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const provider = getESignProvider('built-in', {
      orgId: organizationId,
      orgSlug: org.slug as string,
    });

    const result = await provider.createRequest({
      documentTitle: document_title,
      signerName: signer_name,
      signerEmail: signer_email,
    });

    // Link the esign request to the proposal
    await supabase
      .from('esignature_requests')
      .update({
        proposal_id,
        document_type,
      })
      .eq('id', result.requestId);

    return NextResponse.json(
      {
        requestId: result.requestId,
        signingUrl: result.signingUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[ESign] Error creating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
