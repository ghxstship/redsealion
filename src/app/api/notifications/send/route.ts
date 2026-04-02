import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipient_email,
      recipient_name,
      subject,
      body: emailBody,
      type,
      related_entity_type,
      related_entity_id,
    } = body as {
      recipient_email: string;
      recipient_name?: string;
      subject: string;
      body: string;
      type: string;
      related_entity_type?: string;
      related_entity_id?: string;
    };

    if (!recipient_email || !subject || !emailBody || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient_email, subject, body, type' },
        { status: 400 }
      );
    }

    // Get user's org
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send email
    const result = await sendEmail({
      to: recipient_email,
      toName: recipient_name,
      subject,
      body: emailBody,
    });

    // Record in database
    const { error: dbError } = await supabase
      .from('email_notifications')
      .insert({
        organization_id: userData.organization_id,
        recipient_email,
        recipient_name: recipient_name ?? null,
        subject,
        body: emailBody,
        type,
        related_entity_type: related_entity_type ?? null,
        related_entity_id: related_entity_id ?? null,
        sent_at: result.success ? new Date().toISOString() : null,
        error: result.error ?? null,
      });

    if (dbError) {
      console.error('[Notification] Failed to record:', dbError);
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[Notification] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
