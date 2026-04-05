'use client';

/**
 * Navigation data for the AdminSidebar.
 *
 * Extracted from AdminSidebar to keep the component under 300 lines.
 * Icons are inline SVG for zero-dependency rendering.
 *
 * @module components/admin/sidebar/nav-data
 */

import type { FeatureKey } from '@/lib/subscription';

export interface NavItem {
  label: string;
  href: string;
  feature?: FeatureKey;
  icon: React.ReactNode;
}

export interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
    items: [
      {
        label: 'Dashboard',
        href: '/app',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="7" height="7" rx="1" />
            <rect x="10" y="1" width="7" height="7" rx="1" />
            <rect x="1" y="10" width="7" height="7" rx="1" />
            <rect x="10" y="10" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        label: 'AI Assistant',
        href: '/app/ai',
        feature: 'ai_assistant',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2l.8 2.8a4.5 4.5 0 0 0 3.4 3.4L16 9l-2.8.8a4.5 4.5 0 0 0-3.4 3.4L9 16l-.8-2.8a4.5 4.5 0 0 0-3.4-3.4L2 9l2.8-.8a4.5 4.5 0 0 0 3.4-3.4L9 2Z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8a6 6 0 1 1-2.8-5.1" /><path d="M14 2v4h-4" /></svg>),
    items: [
      { label: 'Leads', href: '/app/leads', feature: 'leads', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 9a7 7 0 1 1-3.3-5.95" /><path d="M16 2v5h-5" /></svg>) },
      { label: 'Pipeline', href: '/app/pipeline', feature: 'pipeline', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h16v3l-6 4v5l-4 2v-7L1 6V3Z" /></svg>) },
      { label: 'Clients', href: '/app/clients', feature: 'clients', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 16v-1.5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3V16" /><circle cx="7.5" cy="5" r="3" /><path d="M16 16v-1.5a3 3 0 0 0-2-2.83" /><path d="M12 2.17a3 3 0 0 1 0 5.66" /></svg>) },
      { label: 'Proposals', href: '/app/proposals', feature: 'proposals', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 1H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7l-6-6Z" /><path d="M10 1v6h6" /></svg>) },
    ],
  },
  {
    id: 'delivery',
    label: 'Project Delivery',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H4a1 1 0 0 0-1 1v12l3.5-2 2 2 2-2L14 15V3a1 1 0 0 0-1-1Z" /><path d="M6 6l2 2 3-3" /></svg>),
    items: [
      { label: 'Tasks', href: '/app/tasks', feature: 'tasks', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H4a1 1 0 0 0-1 1v14l4-2 2 2 2-2 4 2V3a1 1 0 0 0-1-1Z" /><path d="M7 7l2 2 3-3" /></svg>) },
      { label: 'Calendar', href: '/app/calendar', feature: 'calendar', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="14" height="13" rx="1" /><line x1="2" y1="7" x2="16" y2="7" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="12" y1="1" x2="12" y2="4" /></svg>) },
      { label: 'Resources', href: '/app/resources', feature: 'resource_scheduling', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="16" height="12" rx="1" /><path d="M1 7h16" /><path d="M5 3v12" /><path d="M9 3v12" /><path d="M13 3v12" /></svg>) },
      { label: 'Templates', href: '/app/templates', feature: 'templates', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l7-4 7 4" /><path d="M2 10l7 4 7-4" /><path d="M2 6l7 4 7-4" /></svg>) },
      { label: 'Dispatch', href: '/app/dispatch', feature: 'work_orders', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4" /><path d="M12 12l3 3 3-3" /><path d="M15 15V9" /></svg>) },
    ],
  },
  {
    id: 'people',
    label: 'People & Crew',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><path d="M1 14v-1a5 5 0 0 1 10 0v1" /><circle cx="12" cy="5" r="2" /><path d="M15 14v-.5a3.5 3.5 0 0 0-2-3.15" /></svg>),
    items: [
      { label: 'People', href: '/app/people', feature: 'people_hr', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="3" /><path d="M3 16v-1a6 6 0 0 1 12 0v1" /></svg>) },
      { label: 'Crew', href: '/app/crew', feature: 'crew', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5" r="2.5" /><circle cx="13" cy="5" r="2.5" /><circle cx="9" cy="13" r="2.5" /><path d="M5 7.5v2" /><path d="M13 7.5v2" /><path d="M9 10.5v-1" /></svg>) },
      { label: 'Equipment', href: '/app/equipment', feature: 'equipment', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="14" height="8" rx="1" /><path d="M5 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="9" y1="9" x2="9" y2="11" /></svg>) },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="1" x2="8" y2="15" /><path d="M11.5 3.5H6.25a2.25 2.25 0 0 0 0 4.5h3.5a2.25 2.25 0 0 1 0 4.5H4.5" /></svg>),
    items: [
      { label: 'Invoices', href: '/app/invoices', feature: 'invoices', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" /><line x1="6" y1="6" x2="12" y2="6" /><line x1="6" y1="9" x2="12" y2="9" /><line x1="6" y1="12" x2="9" y2="12" /></svg>) },
      { label: 'Expenses', href: '/app/expenses', feature: 'expenses', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="16" height="11" rx="1" /><path d="M1 8h16" /><path d="M5 12h3" /></svg>) },
      { label: 'Budgets', href: '/app/budgets', feature: 'budgets', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="1" x2="9" y2="17" /><path d="M13 4H7a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H5" /></svg>) },
      { label: 'Profitability', href: '/app/profitability', feature: 'profitability', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15l4-5 3 3 5-7" /><path d="M15 6v5h-5" /></svg>) },
      { label: 'Time', href: '/app/time', feature: 'time_tracking', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7.5" /><path d="M9 4.5V9l3 1.5" /></svg>) },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 11L8 14l-5.5-3" /><path d="M13.5 8L8 11 2.5 8" /><path d="M8 2L2.5 5 8 8l5.5-3L8 2Z" /></svg>),
    items: [
      { label: 'Assets', href: '/app/assets', feature: 'assets', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 12.5L9 16l-6.5-3.5" /><path d="M15.5 9L9 12.5 2.5 9" /><path d="M9 2L2.5 5.5 9 9l6.5-3.5L9 2Z" /></svg>) },
      { label: 'Warehouse', href: '/app/warehouse', feature: 'warehouse', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7l8-5 8 5" /><path d="M3 7v8h12V7" /><rect x="7" y="11" width="4" height="4" /></svg>) },
      { label: 'Portfolio', href: '/app/portfolio', feature: 'portfolio', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="16" height="12" rx="1" /><circle cx="5.5" cy="7.5" r="1.5" /><path d="M17 12l-4-4-3 3-2-2-6 6" /></svg>) },
      { label: 'Terms', href: '/app/terms', feature: 'terms', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8" /><path d="M13 2v14" /><path d="M13 2c1.1 0 2 .9 2 2" /><path d="M13 16c1.1 0 2-.9 2-2" /><path d="M15 4v10" /><line x1="6" y1="6" x2="11" y2="6" /><line x1="6" y1="9" x2="10" y2="9" /><line x1="6" y1="12" x2="9" y2="12" /></svg>) },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2" /><path d="M13.4 10a1 1 0 0 0 .2 1.1l.03.03a1.2 1.2 0 1 1-1.7 1.7l-.03-.03a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.92v.1a1.2 1.2 0 0 1-2.4 0v-.05a1 1 0 0 0-.65-.92 1 1 0 0 0-1.1.2l-.03.03a1.2 1.2 0 1 1-1.7-1.7l.03-.03a1 1 0 0 0 .2-1.1 1 1 0 0 0-.92-.6h-.1a1.2 1.2 0 0 1 0-2.4h.05a1 1 0 0 0 .92-.65 1 1 0 0 0-.2-1.1l-.03-.03a1.2 1.2 0 1 1 1.7-1.7l.03.03a1 1 0 0 0 1.1.2h.05a1 1 0 0 0 .6-.92V2.87a1.2 1.2 0 0 1 2.4 0v.05a1 1 0 0 0 .6.92 1 1 0 0 0 1.1-.2l.03-.03a1.2 1.2 0 1 1 1.7 1.7l-.03.03a1 1 0 0 0-.2 1.1v.05a1 1 0 0 0 .92.6h.1a1.2 1.2 0 0 1 0 2.4h-.05a1 1 0 0 0-.92.6Z" /></svg>),
    items: [
      { label: 'Automations', href: '/app/automations', feature: 'automations', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 1L5 9h4l-2 8 6-8h-4l2-8Z" /></svg>) },
      { label: 'Integrations', href: '/app/integrations', feature: 'integrations', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 4.5L6 3 3 6l1.5 1.5" /><path d="M10.5 13.5L12 15l3-3-1.5-1.5" /><line x1="5" y1="13" x2="13" y2="5" /></svg>) },
      { label: 'Emails', href: '/app/emails', feature: 'email_inbox', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="16" height="12" rx="1" /><path d="M1 3l8 6 8-6" /></svg>) },
      { label: 'Reports', href: '/app/reports', feature: 'reports', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 13V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1Z" /><path d="M5 16h8" /><path d="M9 13v3" /><path d="M5 10V8" /><path d="M9 10V7" /><path d="M13 10V6" /></svg>) },
      { label: 'Campaigns', href: '/app/campaigns', feature: 'email_campaigns', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M1 5l8 5 8-5" /></svg>) },
      { label: 'Settings', href: '/app/settings', icon: (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2.5" /><path d="M15.4 11.2a1.2 1.2 0 0 0 .2 1.3l.04.04a1.44 1.44 0 1 1-2.04 2.04l-.04-.04a1.2 1.2 0 0 0-1.3-.2 1.2 1.2 0 0 0-.72 1.1v.12a1.44 1.44 0 0 1-2.88 0v-.06a1.2 1.2 0 0 0-.78-1.1 1.2 1.2 0 0 0-1.3.2l-.04.04a1.44 1.44 0 1 1-2.04-2.04l.04-.04a1.2 1.2 0 0 0 .2-1.3 1.2 1.2 0 0 0-1.1-.72H3.44a1.44 1.44 0 0 1 0-2.88h.06a1.2 1.2 0 0 0 1.1-.78 1.2 1.2 0 0 0-.2-1.3l-.04-.04a1.44 1.44 0 1 1 2.04-2.04l.04.04a1.2 1.2 0 0 0 1.3.2h.06a1.2 1.2 0 0 0 .72-1.1V3.44a1.44 1.44 0 0 1 2.88 0v.06a1.2 1.2 0 0 0 .72 1.1 1.2 1.2 0 0 0 1.3-.2l.04-.04a1.44 1.44 0 1 1 2.04 2.04l-.04.04a1.2 1.2 0 0 0-.2 1.3v.06a1.2 1.2 0 0 0 1.1.72h.12a1.44 1.44 0 0 1 0 2.88h-.06a1.2 1.2 0 0 0-1.1.72Z" /></svg>) },
    ],
  },
];
