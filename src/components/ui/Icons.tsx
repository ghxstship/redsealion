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
  Download as IconDownload,
  Upload as IconUpload,
  ChevronDown as IconChevronDown,
  Search as IconSearch,
  Copy as IconCopy,
  Pencil as IconEdit,

  /* ─── View Types ──────────────────────────────────────── */
  Table as IconTable,
  Kanban as IconBoard,
  Calendar as IconCalendar,
  GanttChart as IconGantt,
  List as IconList,
  LayoutGrid as IconGallery,
  ArrowRight as IconTimeline,
  FileText as IconForm,

  /* ─── Row Heights ─────────────────────────────────────── */
  AlignJustify as IconRowCompact,
  Menu as IconRowDefault,
  StretchHorizontal as IconRowTall,

  /* ─── Status & Indicators ─────────────────────────────── */
  Check as IconCheck,
  AlertTriangle as IconWarning,
  Pin as IconPin,
  ArrowUp as IconArrowUp,
  ArrowDown as IconArrowDown,
  Star as IconStar,
  CirclePlus as IconCirclePlus,
  CircleMinus as IconCircleMinus,
  CircleDot as IconCircleDot,
  CircleCheck as IconCircleCheck,
  RefreshCw as IconRefresh,
  Loader2 as IconLoader,
  AlertCircle as IconAlert,

  /* ─── Collaboration & People ──────────────────────────── */
  User as IconUser,
  Users as IconUsers,
  Lock as IconLock,

  /* ─── Notification Types ──────────────────────────────── */
  Hand as IconHand,
  Bell as IconBell,
  Eye as IconEye,
  ClipboardList as IconClipboard,
  CreditCard as IconCreditCard,
  BarChart3 as IconBarChart,
  Settings as IconSettings,

  /* ─── Move / Reorder ──────────────────────────────────── */
  ChevronUp as IconMoveUp,
  ArrowDown as IconMoveDown,
  GripVertical as IconGripVertical,

  /* ─── Navigation (Structural) ─────────────────────────── */
  Home as IconHome,
  ChevronRight as IconChevronRight,
  ChevronLeft as IconChevronLeft,
  MoreHorizontal as IconMoreHorizontal,
  Menu as IconMenu,

  /* ─── File Types (Export Menu) ─────────────────────────── */
  FileSpreadsheet as IconFileCSV,
  Sheet as IconFileExcel,
  FileJson2 as IconFileJSON,
  FileType2 as IconFileTSV,
  Printer as IconPrinter,
  ClipboardCopy as IconClipboardCopy,
  Columns3 as IconColumns,

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
  Calendar as IconNavCalendar,
  CalendarDays as IconNavEvents,
  Zap as IconNavActivations,
  MapPin as IconNavLocations,
  ListChecks as IconNavTasks,
  ClipboardCheck as IconNavAdvancing,
  ShieldCheck as IconNavCompliance,
  FolderOpen as IconNavFiles,
  Layers as IconNavTemplates,
  Goal as IconNavGoals,
  Route as IconNavRoadmap,
  Clock4 as IconNavSchedule,
  Hammer as IconNavFabrication,
  ShoppingCart as IconNavProcurement,
  Package as IconNavRentals,

  /* ─── Navigation: Operations Items ────────────────────── */
  UserRound as IconNavPeople,
  UsersRound as IconNavCrew,
  LayoutPanelLeft as IconNavWorkloads,
  Clock as IconNavTime,
  Send as IconNavDispatch,
  Package as IconNavInventory,
  Warehouse as IconNavLogistics,

  /* ─── Navigation: Finance Items ───────────────────────── */
  CircleDollarSign as IconNavBudgets,
  CreditCard as IconNavExpenses,
  Receipt as IconNavInvoices,
  ScrollText as IconNavPO,
  Building2 as IconNavVendors,
  LineChart as IconNavRevRec,
  TrendingUp as IconNavProfitability,
  Boxes as IconNavAssets,

  /* ─── Navigation: Admin Items ─────────────────────────── */
  Presentation as IconNavReports,
  Workflow as IconNavAutomations,
  Plug as IconNavIntegrations,
  BookOpen as IconNavTerms,
} from 'lucide-react';
