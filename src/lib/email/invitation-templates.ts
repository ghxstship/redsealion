import type { PlatformRole } from '@/lib/permissions';

// ---------------------------------------------------------------------------
// Personalized invitation email templates per role
// ---------------------------------------------------------------------------

interface InvitationEmailConfig {
  /** Email subject line */
  subject: string;
  /** Heading inside the email body */
  heading: string;
  /** Body paragraph describing the role and what the invitee can do */
  body: string;
  /** CTA button label */
  ctaLabel: string;
  /** Additional context shown below the CTA */
  footer: string;
}

/**
 * Returns a personalized email configuration based on the invitee's role.
 * Used by the invitation system to send context-specific onboarding emails.
 */
export function getInvitationEmailConfig(
  role: PlatformRole,
  orgName: string,
  inviterName?: string,
): InvitationEmailConfig {
  const from = inviterName ? ` from ${inviterName}` : '';

  const configs: Record<PlatformRole, InvitationEmailConfig> = {
    developer: {
      subject: `Platform access granted — ${orgName}`,
      heading: `Developer Access Granted`,
      body: `You've been granted developer-level access to ${orgName} on Red Sealion. This provides full platform operator privileges including system configuration, debugging tools, and API access.`,
      ctaLabel: 'Access Platform',
      footer: 'Developer access includes full system-level permissions. Use responsibly.',
    },
    owner: {
      subject: `You're invited to manage ${orgName}`,
      heading: `Organization Owner Invitation`,
      body: `${orgName} has invited you as an Organization Owner. You'll have full administrative control including billing, team management, and all platform features.`,
      ctaLabel: 'Accept Ownership',
      footer: 'As an owner, you can manage billing, invite team members, and configure all settings.',
    },
    admin: {
      subject: `Admin invitation${from} at ${orgName}`,
      heading: `Admin Access Invitation`,
      body: `You've been invited to join ${orgName} as an Administrator. You'll have full access to manage proposals, projects, team settings, and organizational operations.`,
      ctaLabel: 'Accept Admin Invite',
      footer: 'Admins can manage team members, configure settings, and access all operational features.',
    },
    controller: {
      subject: `Controller access${from} at ${orgName}`,
      heading: `Controller Role Invitation`,
      body: `You've been invited to join ${orgName} as a Controller. This role provides oversight of financial operations including budgets, invoices, reports, and profitability tracking.`,
      ctaLabel: 'Accept Controller Invite',
      footer: 'Controllers have access to financial reporting, budget management, and compliance tools.',
    },
    collaborator: {
      subject: `You're invited to collaborate at ${orgName}`,
      heading: `Team Collaboration Invitation`,
      body: `${orgName} has invited you to join as a Collaborator. You'll be able to manage proposals, track time, create assets, and contribute to projects alongside the team.`,
      ctaLabel: 'Join the Team',
      footer: 'Collaborators can create and edit proposals, manage time tracking, and work on projects.',
    },
    contractor: {
      subject: `Contractor opportunity at ${orgName}`,
      heading: `Contractor Portal Access`,
      body: `${orgName} has invited you as a Contractor. You'll get access to your personalized contractor portal where you can manage bookings, submit bids, track time, and handle compliance documents.`,
      ctaLabel: 'Set Up Contractor Portal',
      footer: 'Your contractor portal gives you access to job postings, bookings, and time tracking.',
    },
    crew: {
      subject: `Crew booking from ${orgName}`,
      heading: `Crew Portal Invitation`,
      body: `${orgName} has added you to their crew roster. You'll be able to view your bookings, manage your availability, and access shift details through your crew portal.`,
      ctaLabel: 'Access Crew Portal',
      footer: 'Your crew portal shows upcoming bookings, shift schedules, and availability management.',
    },
    client: {
      subject: `${orgName} shared a proposal with you`,
      heading: `Client Portal Access`,
      body: `${orgName} has invited you to their client portal. You'll be able to view proposals, approve work, track project progress, and manage invoices — all in one place.`,
      ctaLabel: 'View Your Portal',
      footer: 'Your client portal gives you visibility into proposals, milestones, and invoicing.',
    },
    viewer: {
      subject: `${orgName} granted you viewer access`,
      heading: `Viewer Access Invitation`,
      body: `${orgName} has invited you as a Viewer. You'll have read-only access to proposals, projects, budgets, and reports — perfect for oversight, audits, or board-level visibility.`,
      ctaLabel: 'Access Viewer Portal',
      footer: 'Viewer access is read-only. You can review data but cannot create or modify records.',
    },
    community: {
      subject: `${orgName} invited you to their community`,
      heading: `Community Access`,
      body: `${orgName} has extended community access to you. You can view their public portfolio, explore published projects, and stay connected with their latest work.`,
      ctaLabel: 'Explore Portfolio',
      footer: 'Community members can access public content and portfolio items.',
    },
  };

  return configs[role];
}

/**
 * Generates the full HTML email body for an invitation.
 * Uses inline styles for maximum email client compatibility.
 */
export function renderInvitationEmail(
  config: InvitationEmailConfig,
  acceptUrl: string,
  orgName: string,
  orgLogoUrl?: string | null,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              ${orgLogoUrl ? `<img src="${orgLogoUrl}" alt="${orgName}" width="48" height="48" style="border-radius:8px;margin-bottom:16px;">` : ''}
              <p style="margin:0;color:#71717a;font-size:13px;font-weight:500;">${orgName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 32px;">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b;line-height:1.4;">
                ${config.heading}
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
                ${config.body}
              </p>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}" target="_blank" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;line-height:1;">
                      ${config.ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Footer note -->
              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                ${config.footer}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                This invitation expires in 7 days. If you didn&rsquo;t expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
