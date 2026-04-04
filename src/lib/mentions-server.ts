import { createClient } from '@/lib/supabase/server';

/**
 * Notify users who were mentioned in a comment.
 * This is server-only as it requires the Supabase server client.
 */
export async function notifyMentionedUsers(params: {
  orgId: string;
  entityType: 'task' | 'proposal';
  entityId: string;
  entityTitle: string;
  authorId: string;
  authorName: string;
  mentionedUserIds: string[];
}): Promise<void> {
  const { orgId, entityType, entityId, entityTitle, authorId, authorName, mentionedUserIds } = params;

  // Don't notify the author if they mentioned themselves
  const recipients = mentionedUserIds.filter((id) => id !== authorId);
  if (recipients.length === 0) return;

  try {
    const supabase = await createClient();

    // Create in-app notifications for each mentioned user
    const notifications = recipients.map((userId) => ({
      organization_id: orgId,
      user_id: userId,
      type: 'mention',
      title: `${authorName} mentioned you`,
      body: `You were mentioned in a comment on ${entityType} "${entityTitle}"`,
      entity_type: entityType,
      entity_id: entityId,
      is_read: false,
    }));

    await supabase.from('notifications').insert(notifications);
  } catch {
    // Notification failures should not block the comment creation
  }
}
