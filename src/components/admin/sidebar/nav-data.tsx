'use client';

/**
 * Navigation data for the AdminSidebar.
 *
 * 6 sections structured by mental model:
 *
 * 1. Overview        — Dashboard, AI Assistant
 * 2. Sales & Marketing — CRM pipeline + outreach
 * 3. Production      — Project execution lifecycle
 * 4. Operations      — People, crew, logistics, inventory
 * 5. Finance         — Money in, money out, asset valuation
 * 6. Admin           — Configuration, reporting, integrations
 *
 * Settings removed from sidebar nav — accessible via UserMenu only.
 *
 * All icons sourced from the canonical Icons registry (lucide-react).
 *
 * @module components/admin/sidebar/nav-data
 */

import type { FeatureKey } from '@/lib/subscription';
import {
  IconNavOverview, IconNavSales, IconNavProduction, IconNavOperations,
  IconNavFinance, IconNavAdmin,
  IconNavDashboard, IconNavFavorites, IconNavAI, IconNavMySchedule,
  IconNavMyTasks, IconNavMyInbox, IconNavMyDocs,
  IconNavLeads, IconNavPipeline, IconNavClients, IconNavProposals,
  IconNavCampaigns, IconNavEmails, IconNavPortfolio,
  IconNavCalendar, IconNavEvents, IconNavActivations, IconNavLocations,
  IconNavTasks, IconNavAdvancing, IconNavCompliance, IconNavFiles, IconNavTemplates,
  IconNavPeople, IconNavCrew, IconNavWorkloads, IconNavTime, IconNavDispatch,
  IconNavInventory, IconNavWarehouse,
  IconNavBudgets, IconNavExpenses, IconNavInvoices, IconNavPO, IconNavVendors,
  IconNavRevRec, IconNavProfitability, IconNavAssets,
  IconNavReports, IconNavAutomations, IconNavIntegrations, IconNavTerms,
} from '@/components/ui/Icons';

export interface NavItem {
  label: string;
  labelKey: string;
  href: string;
  feature?: FeatureKey;
  icon: React.ReactNode;
}

export interface NavSection {
  id: string;
  label: string;
  labelKey: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  // ─── 1. OVERVIEW ────────────────────────────────────────────
  {
    id: 'overview',
    label: 'Overview',
    labelKey: 'nav.overview',
    icon: <IconNavOverview size={16} />,
    items: [
      { label: 'Dashboard', labelKey: 'nav.dashboard', href: '/app', icon: <IconNavDashboard size={18} /> },
      { label: 'Favorites', labelKey: 'nav.favorites', href: '/app/favorites', icon: <IconNavFavorites size={18} /> },
      { label: 'AI Assistant', labelKey: 'nav.aiAssistant', href: '/app/ai', feature: 'ai_assistant', icon: <IconNavAI size={18} /> },
      { label: 'My Schedule', labelKey: 'nav.mySchedule', href: '/app/my-schedule', feature: 'calendar', icon: <IconNavMySchedule size={18} /> },
      { label: 'My Tasks', labelKey: 'nav.myTasks', href: '/app/my-tasks', feature: 'tasks', icon: <IconNavMyTasks size={18} /> },
      { label: 'My Inbox', labelKey: 'nav.myInbox', href: '/app/my-inbox', icon: <IconNavMyInbox size={18} /> },
      { label: 'My Documents', labelKey: 'nav.myDocuments', href: '/app/my-documents', icon: <IconNavMyDocs size={18} /> },
    ],
  },

  // ─── 2. SALES & MARKETING ──────────────────────────────────
  {
    id: 'sales',
    label: 'Sales & Marketing',
    labelKey: 'nav.salesMarketing',
    icon: <IconNavSales size={16} />,
    items: [
      { label: 'Leads', labelKey: 'nav.leads', href: '/app/leads', feature: 'leads', icon: <IconNavLeads size={18} /> },
      { label: 'Pipeline', labelKey: 'nav.pipeline', href: '/app/pipeline', feature: 'pipeline', icon: <IconNavPipeline size={18} /> },
      { label: 'Clients', labelKey: 'nav.clients', href: '/app/clients', feature: 'clients', icon: <IconNavClients size={18} /> },
      { label: 'Proposals', labelKey: 'nav.proposals', href: '/app/proposals', feature: 'proposals', icon: <IconNavProposals size={18} /> },
      { label: 'Campaigns', labelKey: 'nav.campaigns', href: '/app/campaigns', feature: 'email_campaigns', icon: <IconNavCampaigns size={18} /> },
      { label: 'Emails', labelKey: 'nav.emails', href: '/app/emails', feature: 'email_inbox', icon: <IconNavEmails size={18} /> },
      { label: 'Portfolio', labelKey: 'nav.portfolio', href: '/app/portfolio', feature: 'portfolio', icon: <IconNavPortfolio size={18} /> },
    ],
  },

  // ─── 3. PRODUCTION ─────────────────────────────────────────
  {
    id: 'production',
    label: 'Production',
    labelKey: 'nav.production',
    icon: <IconNavProduction size={16} />,
    items: [
      { label: 'Calendar', labelKey: 'nav.calendar', href: '/app/calendar', feature: 'calendar', icon: <IconNavCalendar size={18} /> },
      { label: 'Events', labelKey: 'nav.events', href: '/app/events', feature: 'events', icon: <IconNavEvents size={18} /> },
      { label: 'Activations', labelKey: 'nav.activations', href: '/app/activations', feature: 'activations', icon: <IconNavActivations size={18} /> },
      { label: 'Locations', labelKey: 'nav.locations', href: '/app/locations', feature: 'locations', icon: <IconNavLocations size={18} /> },
      { label: 'Tasks', labelKey: 'nav.tasks', href: '/app/tasks', feature: 'tasks', icon: <IconNavTasks size={18} /> },
      { label: 'Advancing', labelKey: 'nav.advancing', href: '/app/advancing', feature: 'work_orders', icon: <IconNavAdvancing size={18} /> },
      { label: 'Compliance', labelKey: 'nav.compliance', href: '/app/compliance', feature: 'crew', icon: <IconNavCompliance size={18} /> },
      { label: 'Files', labelKey: 'nav.files', href: '/app/files', feature: 'proposals', icon: <IconNavFiles size={18} /> },
      { label: 'Templates', labelKey: 'nav.templates', href: '/app/templates', feature: 'templates', icon: <IconNavTemplates size={18} /> },
    ],
  },

  // ─── 4. OPERATIONS ─────────────────────────────────────────
  {
    id: 'operations',
    label: 'Operations',
    labelKey: 'nav.operations',
    icon: <IconNavOperations size={16} />,
    items: [
      { label: 'People', labelKey: 'nav.people', href: '/app/people', feature: 'people_hr', icon: <IconNavPeople size={18} /> },
      { label: 'Crew', labelKey: 'nav.crew', href: '/app/crew', feature: 'crew', icon: <IconNavCrew size={18} /> },
      { label: 'Workloads', labelKey: 'nav.workloads', href: '/app/workloads', feature: 'resource_scheduling', icon: <IconNavWorkloads size={18} /> },
      { label: 'Time', labelKey: 'nav.time', href: '/app/time', feature: 'time_tracking', icon: <IconNavTime size={18} /> },
      { label: 'Dispatch', labelKey: 'nav.dispatch', href: '/app/dispatch', feature: 'work_orders', icon: <IconNavDispatch size={18} /> },
      { label: 'Inventory', labelKey: 'nav.inventory', href: '/app/equipment', feature: 'equipment', icon: <IconNavInventory size={18} /> },
      { label: 'Warehouse', labelKey: 'nav.warehouse', href: '/app/warehouse', feature: 'warehouse', icon: <IconNavWarehouse size={18} /> },
    ],
  },

  // ─── 5. FINANCE ────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Finance',
    labelKey: 'nav.finance',
    icon: <IconNavFinance size={16} />,
    items: [
      { label: 'Budgets', labelKey: 'nav.budgets', href: '/app/budgets', feature: 'budgets', icon: <IconNavBudgets size={18} /> },
      { label: 'Expenses', labelKey: 'nav.expenses', href: '/app/expenses', feature: 'expenses', icon: <IconNavExpenses size={18} /> },
      { label: 'Invoices', labelKey: 'nav.invoices', href: '/app/invoices', feature: 'invoices', icon: <IconNavInvoices size={18} /> },
      { label: 'Purchase Orders', labelKey: 'nav.purchaseOrders', href: '/app/finance/purchase-orders', feature: 'expenses', icon: <IconNavPO size={18} /> },
      { label: 'Vendors', labelKey: 'nav.vendors', href: '/app/finance/vendors', feature: 'profitability', icon: <IconNavVendors size={18} /> },
      { label: 'Revenue Recognition', labelKey: 'nav.revenueRecognition', href: '/app/finance/revenue-recognition', feature: 'profitability', icon: <IconNavRevRec size={18} /> },
      { label: 'Profitability', labelKey: 'nav.profitability', href: '/app/profitability', feature: 'profitability', icon: <IconNavProfitability size={18} /> },
      { label: 'Assets', labelKey: 'nav.assets', href: '/app/assets', feature: 'assets', icon: <IconNavAssets size={18} /> },
    ],
  },

  // ─── 6. ADMIN ──────────────────────────────────────────────
  {
    id: 'admin',
    label: 'Admin',
    labelKey: 'nav.admin',
    icon: <IconNavAdmin size={16} />,
    items: [
      { label: 'Reports', labelKey: 'nav.reports', href: '/app/reports', feature: 'reports', icon: <IconNavReports size={18} /> },
      { label: 'Automations', labelKey: 'nav.automations', href: '/app/automations', feature: 'automations', icon: <IconNavAutomations size={18} /> },
      { label: 'Integrations', labelKey: 'nav.integrations', href: '/app/integrations', feature: 'integrations', icon: <IconNavIntegrations size={18} /> },
      { label: 'Terms', labelKey: 'nav.terms', href: '/app/terms', feature: 'terms', icon: <IconNavTerms size={18} /> },
    ],
  },
];
