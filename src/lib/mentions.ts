/**
 * @mention parsing and notification utilities.
 *
 * Mentions use the syntax `@[Display Name](user_id)` within comment bodies.
 * This module extracts mentioned user IDs and triggers notifications.
 *
 * @module lib/mentions
 */

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

