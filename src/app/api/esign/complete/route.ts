import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notifySignatureCompleted } from '@/lib/notifications/triggers';

/**
 * Public endpoint for completing a signature.
 * No authentication required -- signers access this via a token-based URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signature_data } = body as {
      token: string;
      signature_data: string;
    };

    if (!token || !signature_data) {
      return NextResponse.json(
        { error: 'Missing required fields: token, signature_data' },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    // Find the signature request by token
    const { data: esignRequest, error: findError } = await supabase
      .from('esignature_requests')
      .select('id, status')
      .eq('token', token)
      .single();

    if (findError || !esignRequest) {
      return NextResponse.json(
        { error: 'Signature request not found' },
        { status: 404 },
      );
    }

    if (esignRequest.status === 'signed') {
      return NextResponse.json(
        { error: 'This document has already been signed' },
        { status: 409 },
      );
    }

    // Extract signer IP from request headers
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const { error: updateError } = await supabase
      .from('esignature_requests')
      .update({
        status: 'signed',
        signature_data,
        signed_at: new Date().toISOString(),
        signer_ip: ip,
      })
      .eq('id', esignRequest.id);

    if (updateError) {
      console.error('[ESign] Failed to complete signature:', updateError);
      return NextResponse.json(
        { error: 'Failed to record signature' },
        { status: 500 },
      );
    }

    // Fire-and-forget: notify org admin that the document was signed
    notifySignatureCompleted(esignRequest.id).catch((err) => {
      console.error('[ESign] Failed to send completion notification:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ESign] Error completing signature:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
