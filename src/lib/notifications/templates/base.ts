/**
 * Base HTML email layout for FlyteDeck transactional emails.
 *
 * All styles are inlined for maximum email-client compatibility.
 */

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Wrap arbitrary HTML content in the standard FlyteDeck email shell.
 */
export function wrapEmailHtml(
  content: string,
  orgName: string,
  logoUrl?: string,
): string {
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="max-height:40px;max-width:180px;margin-bottom:8px;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${orgName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Header -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              ${logoBlock}
              <p style="margin:0;font-size:14px;font-weight:600;color:#52525b;font-family:${FONT_STACK};">${orgName}</p>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 32px 40px 32px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:24px 0 0 0;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;font-family:${FONT_STACK};">
                Sent via <a href="https://flytedeck.com" style="color:#a1a1aa;text-decoration:underline;">FlyteDeck</a>
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#d4d4d8;font-family:${FONT_STACK};">
                <a href="{{unsubscribe_url}}" style="color:#d4d4d8;text-decoration:underline;">Unsubscribe</a>
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

/**
 * Render a primary CTA button (dark background, white text).
 */
export function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0 0;">
  <tr>
    <td align="center" style="background-color:#1a1a1a;border-radius:6px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${FONT_STACK};">${text}</a>
    </td>
  </tr>
</table>`;
}

/**
 * Render a secondary / outline CTA button.
 */
export function secondaryButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 0 0;">
  <tr>
    <td align="center" style="background-color:#ffffff;border-radius:6px;border:1px solid #d4d4d8;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#1a1a1a;text-decoration:none;font-family:${FONT_STACK};">${text}</a>
    </td>
  </tr>
</table>`;
}

/**
 * Render a heading for the email body.
 */
export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;font-family:${FONT_STACK};">${text}</h1>`;
}

/**
 * Render a paragraph of body text.
 */
export function paragraph(text: string): string {
  return `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#3f3f46;font-family:${FONT_STACK};">${text}</p>`;
}

/**
 * Render a key-value detail row.
 */
export function detailRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:6px 0;font-size:14px;color:#71717a;font-family:${FONT_STACK};">${label}</td>
  <td style="padding:6px 0;font-size:14px;font-weight:600;color:#18181b;text-align:right;font-family:${FONT_STACK};">${value}</td>
</tr>`;
}

/**
 * Wrap detail rows in a table.
 */
export function detailTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;padding:4px 0;">
  ${rows}
</table>`;
}
