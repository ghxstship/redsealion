'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return { error: 'Not authorized' };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = (formData.get('category') as string) || 'Company';
  const start_date = formData.get('start_date') as string || null;
  const due_date = formData.get('due_date') as string || null;

  const { error } = await supabase.from('goals').insert({
    organization_id: ctx.organizationId,
    title,
    description,
    category,
    start_date,
    due_date,
    status: 'on_track',
    progress: 0,
  });

  if (error) {
    console.error('Failed to create goal:', error);
    return { error: 'Failed to create goal' };
  }

  revalidatePath('/app/goals');
  return { success: true };
}

export async function updateGoal(id: string, formData: FormData) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return { error: 'Not authorized' };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const start_date = formData.get('start_date') as string || null;
  const due_date = formData.get('due_date') as string || null;
  const status = formData.get('status') as string;

  const { error } = await supabase
    .from('goals')
    .update({
      title,
      description,
      category,
      start_date,
      due_date,
      status,
    })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);

  if (error) {
    console.error('Failed to update goal:', error);
    return { error: 'Failed to update goal' };
  }

  revalidatePath('/app/goals');
  return { success: true };
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return { error: 'Not authorized' };

  const { error } = await supabase
    .from('goals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);

  if (error) return { error: 'Failed to delete goal' };

  revalidatePath('/app/goals');
  return { success: true };
}

export async function createKeyResult(goalId: string, formData: FormData) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return { error: 'Not authorized' };

  const title = formData.get('title') as string;
  const start_value = parseFloat(formData.get('start_value') as string) || 0;
  const target = parseFloat(formData.get('target') as string) || 0;
  const unit = formData.get('unit') as string;

  const { error } = await supabase.from('goal_key_results').insert({
    goal_id: goalId,
    title,
    start_value,
    target,
    current: start_value,
    unit,
  });

  if (error) {
    console.error('Failed to create key result:', error);
    return { error: 'Failed to create key result' };
  }

  revalidatePath('/app/goals');
  return { success: true };
}

export async function deleteKeyResult(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return { error: 'Not authorized' };

  // Verify the key result belongs to a goal owned by this org
  const { data: kr } = await supabase
    .from('goal_key_results')
    .select('id, goal_id, goals!inner(organization_id)')
    .eq('id', id)
    .eq('goals.organization_id', ctx.organizationId)
    .single();

  if (!kr) return { error: 'Key result not found' };

  const { error } = await supabase
    .from('goal_key_results')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'Failed to delete KR' };

  revalidatePath('/app/goals');
  return { success: true };
}

export async function createCheckIn(goalId: string, formData: FormData) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return { error: 'Not authorized' };

  const new_progress = parseInt(formData.get('new_progress') as string) || 0;
  const previous_progress = parseInt(formData.get('previous_progress') as string) || 0;
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;

  // Insert checkin (source of truth for progress history)
  const { error: checkinError } = await supabase.from('goal_check_ins').insert({
    goal_id: goalId,
    new_progress,
    previous_progress,
    status,
    notes,
  });

  if (checkinError) {
    console.error('Failed to insert check-in:', checkinError);
    return { error: 'Failed to insert check-in' };
  }

  // Denormalized update: sync goals.progress & goals.status from the latest check-in.
  // This is intentional for query performance — the check-ins table is the SSOT.
  // If a check-in is deleted, the caller must re-derive progress from the latest remaining check-in.
  await supabase
    .from('goals')
    .update({ progress: new_progress, status })
    .eq('id', goalId)
    .eq('organization_id', ctx.organizationId);

  revalidatePath('/app/goals');
  return { success: true };
}

/** Re-derive goal progress from the latest check-in. Called after check-in deletion. */
export async function recalculateGoalProgress(goalId: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return;

  const { data: latestCheckIn } = await supabase
    .from('goal_check_ins')
    .select('new_progress, status')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  await supabase
    .from('goals')
    .update({
      progress: latestCheckIn?.new_progress ?? 0,
      status: latestCheckIn?.status ?? 'not_started',
    })
    .eq('id', goalId)
    .eq('organization_id', ctx.organizationId);

  revalidatePath('/app/goals');
}
