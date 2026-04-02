import { NextRequest, NextResponse } from 'next/server';
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

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const body = await request.json();
    const automationId: string | undefined = body.automationId;
    const triggerData: Record<string, unknown> = body.triggerData ?? {};

    if (!automationId) {
      return NextResponse.json({ error: 'Automation ID required' }, { status: 400 });
    }

    // Fetch the automation
    const { data: automation } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (!automation.is_active) {
      return NextResponse.json({ error: 'Automation is inactive' }, { status: 400 });
    }

    // Create a run record
    const { data: run } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: automationId,
        organization_id: userData.organization_id,
        status: 'running',
        trigger_data: triggerData,
      })
      .select('id')
      .single();

    // Placeholder: In production, execute the action based on automation.action_type
    // For now, mark as completed
    if (run) {
      await supabase
        .from('automation_runs')
        .update({
          status: 'completed',
          result: { message: 'Placeholder execution' },
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    // Increment run count
    await supabase
      .from('automations')
      .update({
        run_count: (automation.run_count ?? 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', automationId);

    return NextResponse.json({
      success: true,
      automationId,
      runId: run?.id,
    });
  } catch (error) {
    console.error('Automation run error:', error);
    return NextResponse.json({ error: 'Automation execution failed' }, { status: 500 });
  }
}
