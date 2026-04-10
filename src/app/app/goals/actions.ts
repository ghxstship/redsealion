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

  // Note: the progress UI might submit the old and new progress.
  const new_progress = parseInt(formData.get('new_progress') as string) || 0;
  const previous_progress = parseInt(formData.get('previous_progress') as string) || 0;
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;

  // Insert checkin
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

  // Update Goal
  await supabase
    .from('goals')
    .update({ progress: new_progress, status })
    .eq('id', goalId)
    .eq('organization_id', ctx.organizationId);

  revalidatePath('/app/goals');
  return { success: true };
}
