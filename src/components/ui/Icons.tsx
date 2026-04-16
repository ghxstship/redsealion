/**
 * Canonical icon re-exports from lucide-react.
 *
 * All UI icons are sourced exclusively from lucide-react.
 * This barrel provides aliased names used throughout the design system.
 *
 * RULES:
 * 1. Every icon used anywhere in the app MUST have a semantic alias here.
 * 2. Each concept gets ONE unique lucide icon — no duplicate mappings.
 * 3. Import from this file instead of lucide-react directly when using
 *    a design-system alias (Icon* prefix).
 *
 * @module components/ui/Icons
 */

export {
  /* ─── Core UI Actions ─────────────────────────────────── */
  X as IconX,
  Plus as IconPlus,
  Trash2 as IconTrash,
  
  
  ChevronDown as IconChevronDown,
  
  
  

  /* ─── View Types ──────────────────────────────────────── */
  
  
  Calendar as IconCalendar,
  
  
  
  
  FileText as IconForm,

  /* ─── Row Heights ─────────────────────────────────────── */
  
  
  

  /* ─── Status & Indicators ─────────────────────────────── */
  Check as IconCheck,
  
  
  
  ArrowDown as IconArrowDown,
  Star as IconStar,
  
  
  
  
  
  
  

  /* ─── Collaboration & People ──────────────────────────── */
  
  Users as IconUsers,
  Lock as IconLock,

  /* ─── Notification Types ──────────────────────────────── */
  
  
  
  
  
  BarChart3 as IconBarChart,
  Settings as IconSettings,

  /* ─── Move / Reorder ──────────────────────────────────── */
  
  
  

  /* ─── Navigation (Structural) ─────────────────────────── */
  
  ChevronRight as IconChevronRight,
  
  
  Menu as IconMenu,

  /* ─── File Types (Export Menu) ─────────────────────────── */
  
  
  
  
  
  
  

  /* ─── Navigation: Section Headers ─────────────────────── */
  Compass as IconNavOverview,
  FolderKanban as IconNavProjects,
  Target as IconNavSales,
  Clapperboard as IconNavProduction,
  Wrench as IconNavOperations,
  Wallet as IconNavFinance,
  Shield as IconNavAdmin,

  /* ─── Navigation: Overview Items ──────────────────────── */
  LayoutDashboard as IconNavDashboard,
  Star as IconNavFavorites,
  Sparkles as IconNavAI,
  CalendarClock as IconNavMySchedule,
  CircleCheckBig as IconNavMyTasks,
  Inbox as IconNavMyInbox,
  FileStack as IconNavMyDocs,

  /* ─── Navigation: Sales & Marketing Items ─────────────── */
  Radar as IconNavLeads,
  Filter as IconNavPipeline,
  Users as IconNavClients,
  FileText as IconNavProposals,
  Megaphone as IconNavCampaigns,
  Mail as IconNavEmails,
  Image as IconNavPortfolio,

  /* ─── Navigation: Production Items ────────────────────── */
  
  CalendarDays as IconNavEvents,
  Zap as IconNavActivations,
  MapPin as IconNavLocations,
  ListChecks as IconNavTasks,
  ClipboardCheck as IconNavAdvancing,
  ClipboardList as IconNavManifest,
  ShieldCheck as IconNavCompliance,
  FolderOpen as IconNavFiles,
  Layers as IconNavTemplates,
  Goal as IconNavGoals,
  Route as IconNavRoadmap,
  Clock4 as IconNavSchedule,
  
  
  
  Send as IconNavWorkOrders,

  /* ─── Navigation: Operations Items ────────────────────── */
  UserRound as IconNavPeople,
  UsersRound as IconNavCrew,
  LayoutPanelLeft as IconNavWorkloads,
  Clock as IconNavTime,
  
  Store as IconNavMarketplace,
  Package as IconNavInventory,
  Warehouse as IconNavLogistics,
  Truck as IconNavDispatch,
  Box as IconNavAssets,

  /* ─── Navigation: Finance Items ───────────────────────── */
  
  CreditCard as IconNavExpenses,
  Receipt as IconNavInvoices,
  PieChart as IconNavBudgets,
  
  
  TrendingUp as IconNavProfitability,
  

  /* ─── Navigation: Admin Items ─────────────────────────── */
  Presentation as IconNavReports,
  Workflow as IconNavAutomations,
  Plug as IconNavIntegrations,
  BookOpen as IconNavTerms,
  Eye as IconNavPortalPreview,
  Calendar as IconNavCalendar,
} from 'lucide-react';
