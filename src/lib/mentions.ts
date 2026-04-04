/**
 * @mention parsing and notification utilities.
 *
 * Mentions use the syntax `@[Display Name](user_id)` within comment bodies.
 * This module extracts mentioned user IDs and triggers notifications.
 *
 * @module lib/mentions
 */

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Mention parsing
// ---------------------------------------------------------------------------

const MENTION_REGEX = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;

export interface ParsedMention {
  displayName: string;
  userId: string;
}

/**
 * Extract all @mentions from a comment body.
 */
export function parseMentions(body: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX.source, MENTION_REGEX.flags);

  while ((match = regex.exec(body)) !== null) {
    mentions.push({
      displayName: match[1],
      userId: match[2],
    });
  }

  return mentions;
}

/**
 * Extract only user IDs from mentioned users.
 */
export function extractMentionedUserIds(body: string): string[] {
  return parseMentions(body).map((m) => m.userId);
}

/**
 * Convert raw body text with mentions to display HTML.
 * Replaces `@[Name](id)` with `<span class="mention">@Name</span>`.
 */
export function renderMentions(body: string): string {
  return body.replace(
    MENTION_REGEX,
    '<span class="mention font-medium text-blue-600">@$1</span>',
  );
}

// ---------------------------------------------------------------------------
// Mention notifications
// ---------------------------------------------------------------------------

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
