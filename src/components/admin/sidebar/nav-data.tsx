/**
 * Navigation data for the AdminSidebar.
 *
 * 7 sections structured by mental model:
 *
 * 1. Overview        — Dashboard, personal workspace
 * 2. Projects        — Project management, tasks, files, templates
 * 3. Sales & Marketing — CRM pipeline + outreach
 * 4. Productions     — Live event execution, advancing
 * 5. Operations      — People, crew, logistics, inventory
 * 6. Finance         — Money in, money out, budgets
 * 7. Admin           — Configuration, reporting, integrations
 *
 * Settings removed from sidebar nav — accessible via UserMenu only.
 *
 * All icons sourced from the canonical Icons registry (lucide-react).
 *
 * @module components/admin/sidebar/nav-data
 */

import type { FeatureKey } from '@/lib/subscription';
import {
  IconNavOverview, IconNavProjects, IconNavSales, IconNavProduction,
  IconNavOperations, IconNavFinance, IconNavAdmin,
  IconNavDashboard, IconNavFavorites, IconNavAI, IconNavMySchedule,
  IconNavMyTasks, IconNavMyInbox, IconNavMyDocs,
  IconNavTasks, IconNavGoals, IconNavRoadmap, IconNavFiles, IconNavTemplates,
  IconNavLeads, IconNavPipeline, IconNavClients, IconNavProposals,
  IconNavCampaigns, IconNavEmails, IconNavPortfolio,
  IconNavEvents, IconNavLocations, IconNavAdvancing, IconNavManifest, IconNavSchedule,
  IconNavWorkOrders,
  IconNavPeople, IconNavCrew, IconNavWorkloads, IconNavTime,
  IconNavMarketplace, IconNavInventory, IconNavLogistics, IconNavCompliance,
  IconNavFinance as IconNavFinanceItem, IconNavExpenses,
  IconNavReports, IconNavAutomations, IconNavIntegrations, IconNavTerms,
} from '@/components/ui/Icons';

interface NavItem {
  label: string;
  labelKey: string;
  href: string;
  feature?: FeatureKey;
  icon: React.ReactNode;
}

interface NavSection {
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

  // ─── 2. PROJECTS ────────────────────────────────────────────
  {
    id: 'projects',
    label: 'Projects',
    labelKey: 'nav.projects',
    icon: <IconNavProjects size={16} />,
    items: [
      { label: 'Projects', labelKey: 'nav.projects', href: '/app/projects', feature: 'projects', icon: <IconNavProjects size={18} /> },
      { label: 'Tasks', labelKey: 'nav.tasks', href: '/app/tasks', feature: 'tasks', icon: <IconNavTasks size={18} /> },
      { label: 'Goals', labelKey: 'nav.goals', href: '/app/goals', feature: 'tasks', icon: <IconNavGoals size={18} /> },
      { label: 'Roadmap', labelKey: 'nav.roadmap', href: '/app/roadmap', feature: 'roadmap', icon: <IconNavRoadmap size={18} /> },
      { label: 'Files', labelKey: 'nav.files', href: '/app/files', feature: 'files', icon: <IconNavFiles size={18} /> },
      { label: 'Templates', labelKey: 'nav.templates', href: '/app/templates', feature: 'templates', icon: <IconNavTemplates size={18} /> },
    ],
  },

  // ─── 3. SALES & MARKETING ──────────────────────────────────
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

  // ─── 4. PRODUCTIONS ────────────────────────────────────────
  // Live event execution: hierarchy, advancing, manifest, scheduling
  {
    id: 'productions',
    label: 'Productions',
    labelKey: 'nav.productions',
    icon: <IconNavProduction size={16} />,
    items: [
      { label: 'Events', labelKey: 'nav.events', href: '/app/events', feature: 'events', icon: <IconNavEvents size={18} /> },
      { label: 'Locations', labelKey: 'nav.locations', href: '/app/locations', feature: 'locations', icon: <IconNavLocations size={18} /> },
      { label: 'Advancing', labelKey: 'nav.advancing', href: '/app/advancing', feature: 'advancing', icon: <IconNavAdvancing size={18} /> },
      { label: 'Manifest', labelKey: 'nav.manifest', href: '/app/manifest', feature: 'advancing', icon: <IconNavManifest size={18} /> },
      { label: 'Schedule', labelKey: 'nav.schedule', href: '/app/schedule', feature: 'events', icon: <IconNavSchedule size={18} /> },
      { label: 'Work Orders', labelKey: 'nav.workOrders', href: '/app/work-orders', feature: 'work_orders', icon: <IconNavWorkOrders size={18} /> },
    ],
  },

  // ─── 5. OPERATIONS ─────────────────────────────────────────
  // Org-level resources: people, equipment, logistics, compliance
  {
    id: 'operations',
    label: 'Operations',
    labelKey: 'nav.operations',
    icon: <IconNavOperations size={16} />,
    items: [
      { label: 'People', labelKey: 'nav.people', href: '/app/people', feature: 'people_hr', icon: <IconNavPeople size={18} /> },
      { label: 'Crew', labelKey: 'nav.crew', href: '/app/crew', feature: 'crew', icon: <IconNavCrew size={18} /> },
      { label: 'Equipment', labelKey: 'nav.equipment', href: '/app/equipment', feature: 'equipment', icon: <IconNavInventory size={18} /> },
      { label: 'Logistics', labelKey: 'nav.logistics', href: '/app/logistics', feature: 'warehouse', icon: <IconNavLogistics size={18} /> },
      { label: 'Workloads', labelKey: 'nav.workloads', href: '/app/workloads', feature: 'resource_scheduling', icon: <IconNavWorkloads size={18} /> },
      { label: 'Time', labelKey: 'nav.time', href: '/app/time', feature: 'time_tracking', icon: <IconNavTime size={18} /> },
      { label: 'Marketplace', labelKey: 'nav.marketplace', href: '/app/marketplace', feature: 'marketplace', icon: <IconNavMarketplace size={18} /> },
      { label: 'Compliance', labelKey: 'nav.compliance', href: '/app/compliance', feature: 'compliance', icon: <IconNavCompliance size={18} /> },
    ],
  },

  // ─── 6. FINANCE ────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Finance',
    labelKey: 'nav.finance',
    icon: <IconNavFinance size={16} />,
    items: [
      { label: 'Finance', labelKey: 'nav.financeHub', href: '/app/finance', feature: 'profitability', icon: <IconNavFinanceItem size={18} /> },
      { label: 'Expenses', labelKey: 'nav.expenses', href: '/app/expenses', feature: 'expenses', icon: <IconNavExpenses size={18} /> },
    ],
  },

  // ─── 7. ADMIN ──────────────────────────────────────────────
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

