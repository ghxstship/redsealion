import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireCronAuth } from '@/lib/api/cron-guard';
import { executeReport, rowsToCsv } from '@/lib/reports/executor';
import { ResendEmailProvider } from '@/lib/notifications/email';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron:scheduled-reports');

/**
 * Cron endpoint for scheduled report delivery.
 *
 * Queries `custom_reports` where `schedule IS NOT NULL` and `recipients` is non-empty,
 * determines which reports are due based on the schedule config, runs each report,
 * generates a CSV, and emails it to the specified recipients.
 *
 * Schedule config shape (stored as JSONB):
 * {
 *   "frequency": "daily" | "weekly" | "monthly",
 *   "day": "monday" | "tuesday" | ... (for weekly),
 *   "dayOfMonth": 1-28 (for monthly),
 *   "time": "09:00" (24h format, used for display only — cron runs on fixed schedule),
 *   "lastSentAt": "2026-04-10T09:00:00Z" (updated after each send)
 * }
 *
 * Schedule: hourly at :05
 *   { "path": "/api/cron/scheduled-reports", "schedule": "5 * * * *" }
 */
export async function GET(request: Request) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  try {
    const supabase = await createServiceClient();
    const emailProvider = new ResendEmailProvider();
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentDayOfMonth = now.getDate();

    // Fetch all reports with a schedule and at least one recipient
    const { data: scheduledReports, error } = await supabase
      .from('custom_reports')
      .select('id, organization_id, name, description, query_config, schedule, recipients, created_by')
      .not('schedule', 'is', null)
      .not('recipients', 'is', null);

    if (error) {
      log.error('Failed to fetch scheduled reports', {}, error);
      return NextResponse.json({ error: 'Failed to fetch scheduled reports' }, { status: 500 });
    }

    if (!scheduledReports || scheduledReports.length === 0) {
      return NextResponse.json({ success: true, processed: 0, sent: 0 });
    }

    let processed = 0;
    let sent = 0;
    const errors: string[] = [];

    for (const report of scheduledReports) {
      processed++;

      try {
        const schedule = report.schedule as {
          frequency?: string;
          day?: string;
          dayOfMonth?: number;
          time?: string;
          lastSentAt?: string;
        };

        const recipients = report.recipients as string[];
        if (!recipients || recipients.length === 0) continue;
        if (!schedule || !schedule.frequency) continue;

        // ── Check if this report is due ──────────────────────────
        if (!isReportDue(schedule, now, currentDay, currentDayOfMonth)) {
          continue;
        }

        // ── Execute the report query ─────────────────────────────
        const config = (report.query_config ?? {}) as {
          dataSource: string;
          visualization?: string;
          columns: Array<{ id: string; field: string; label: string; aggregate?: string }>;
          filters: Array<{ id: string; field: string; operator: string; value: string }>;
        };

        if (!config.dataSource) {
          log.warn(`Report ${report.id} has no dataSource in query_config`, {});
          continue;
        }

        const rows = await executeReport(supabase, report.organization_id, config);
        const csv = rowsToCsv(rows, config.columns ?? []);

        // ── Build email HTML ─────────────────────────────────────
        const reportDate = now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const html = buildReportEmailHtml({
          reportName: report.name,
          description: report.description,
          reportDate,
          rowCount: rows.length,
          csv,
          frequency: schedule.frequency,
        });

        // ── Send to each recipient ───────────────────────────────
        for (const recipient of recipients) {
          try {
            await emailProvider.send(
              recipient,
              `📊 ${report.name} — Scheduled Report (${reportDate})`,
              html,
            );
          } catch (emailErr) {
            log.error(`Failed to send report ${report.id} to ${recipient}`, {}, emailErr);
          }
        }

        // ── Update lastSentAt ────────────────────────────────────
        await supabase
          .from('custom_reports')
          .update({
            schedule: { ...schedule, lastSentAt: now.toISOString() },
          })
          .eq('id', report.id);

        sent++;
        log.info(`Sent scheduled report "${report.name}" to ${recipients.length} recipient(s)`, {
          reportId: report.id,
          rows: rows.length,
        });
      } catch (reportErr) {
        const errMsg = `Report ${report.id} failed: ${reportErr instanceof Error ? reportErr.message : String(reportErr)}`;
        errors.push(errMsg);
        log.error(errMsg, {}, reportErr);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      sent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    log.error('Scheduled reports cron failed', {}, err);
    return NextResponse.json(
      { error: 'Internal error processing scheduled reports.' },
      { status: 500 },
    );
  }
}

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

/**
 * Determine if a report is due to be sent based on its schedule config.
 */
function isReportDue(
  schedule: { frequency?: string; day?: string; dayOfMonth?: number; lastSentAt?: string },
  now: Date,
  currentDay: string,
  currentDayOfMonth: number,
): boolean {
  const { frequency, day, dayOfMonth, lastSentAt } = schedule;

  // Check if already sent in this period
  if (lastSentAt) {
    const lastSent = new Date(lastSentAt);
    const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

    switch (frequency) {
      case 'daily':
        if (hoursSinceLast < 20) return false; // Not sent again within 20h
        break;
      case 'weekly':
        if (hoursSinceLast < 144) return false; // Not sent again within 6 days
        break;
      case 'monthly':
        if (hoursSinceLast < 576) return false; // Not sent again within 24 days
        break;
    }
  }

  switch (frequency) {
    case 'daily':
      return true; // Due every day

    case 'weekly':
      // Due on the configured day of the week
      return (day ?? 'monday') === currentDay;

    case 'monthly':
      // Due on the configured day of the month
      return (dayOfMonth ?? 1) === currentDayOfMonth;

    default:
      return false;
  }
}

/**
 * Build a styled HTML email with the report summary and CSV attachment as inline content.
 */
function buildReportEmailHtml(opts: {
  reportName: string;
  description: string | null;
  reportDate: string;
  rowCount: number;
  csv: string;
  frequency: string;
}): string {
  const { reportName, description, reportDate, rowCount, csv, frequency } = opts;

  // Parse CSV into an HTML table (first 50 rows)
  const csvLines = csv.split('\n').filter(Boolean);
  const headers = csvLines[0]?.split(',') ?? [];
  const dataRows = csvLines.slice(1, 51); // Max 50 rows in email

  let tableHtml = '';
  if (headers.length > 0 && dataRows.length > 0) {
    tableHtml = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <thead>
          <tr style="background:#f4f4f5;border-bottom:2px solid #e4e4e7;">
            ${headers.map((h) => `<th style="padding:8px 12px;text-align:left;font-weight:600;color:#18181b;">${h.replace(/"/g, '')}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataRows.map((row, i) => {
            const cells = row.split(',');
            const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
            return `<tr style="background:${bg};border-bottom:1px solid #e4e4e7;">${cells.map((c) => `<td style="padding:6px 12px;color:#3f3f46;">${c.replace(/"/g, '')}</td>`).join('')}</tr>`;
          }).join('')}
        </tbody>
      </table>
      ${rowCount > 50 ? `<p style="font-size:12px;color:#71717a;margin-top:4px;">Showing 50 of ${rowCount} rows. Download the full report from your dashboard.</p>` : ''}
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f4f4f5;">
      <div style="max-width:680px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#18181b 0%,#27272a 100%);padding:28px 32px;">
          <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">📊 ${reportName}</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;">${frequency.charAt(0).toUpperCase() + frequency.slice(1)} report • ${reportDate}</p>
        </div>

        <!-- Body -->
        <div style="padding:24px 32px;">
          ${description ? `<p style="font-size:14px;color:#52525b;margin:0 0 16px;">${description}</p>` : ''}

          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <div style="background:#f4f4f5;border-radius:8px;padding:12px 16px;">
              <p style="margin:0;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Total Rows</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:600;color:#18181b;">${rowCount}</p>
            </div>
          </div>

          ${tableHtml || '<p style="font-size:14px;color:#71717a;">No data to display for this period.</p>'}
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #e4e4e7;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            This report was automatically generated by FlyteDeck.
            To change the schedule or recipients, edit the report in your dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
