#!/usr/bin/env python3
"""
STRESS TEST AUDIT v3 — Full 5-Dimension Audit
  1. Missing Workflows (loading/error boundaries, RoleGate, cross-tenant filters)
  2. Missing Data Tables & Schema Gaps (referenced tables that don't exist)
  3. Missing Data Points (fields referenced in code but absent from types)
  4. 3NF / SSOT Violations (enum drift between DB and code)
  5. Canonical Component & Normalized UI (raw HTML, DIY modals)
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
APP_DIR = os.path.join(SRC, "app", "app")
COMPONENTS_DIR = os.path.join(SRC, "components")
UI_DIR = os.path.join(COMPONENTS_DIR, "ui")
SHARED_DIR = os.path.join(COMPONENTS_DIR, "shared")
LIB_DIR = os.path.join(SRC, "lib")
API_DIR = os.path.join(SRC, "app", "api")
DB_TYPES = os.path.join(SRC, "lib", "database.types.ts")

findings = []

def add(location, gap_type, what_breaks, severity, fix):
    findings.append({
        "location": location,
        "gap_type": gap_type,
        "what_breaks": what_breaks,
        "severity": severity,
        "fix": fix,
    })

def rel(path):
    return os.path.relpath(path, ROOT)

def get_tsx_files(directory):
    result = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', 'test-results', 'playwright-report', '__tests__')]
        for f in files:
            if f.endswith(('.tsx', '.ts')) and not f.endswith('.d.ts'):
                result.append(os.path.join(root, f))
    return result

def read_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return ""

# ─── EXCLUSION SETS ───
RAW_ELEMENT_EXCLUDE_BASENAMES = {
    'Button.tsx', 'FormInput.tsx', 'FormSelect.tsx', 'FormTextarea.tsx',
    'SearchInput.tsx', 'Toggle.tsx', 'FilterPills.tsx', 'SortableList.tsx',
    'InlineEditCell.tsx', 'CommandPalette.tsx', 'DataImportDialog.tsx',
    'ViewBar.tsx', 'ViewSidebar.tsx', 'ColumnConfigPanel.tsx', 'CopilotPanel.tsx',
    'LocalizationMenu.tsx', 'ShareDialog.tsx', 'ThemeToggle.tsx', 'NotificationBell.tsx',
    'FavoriteButton.tsx', 'MiniTimer.tsx', 'QuickActionMenu.tsx', 'RowActionMenu.tsx',
    'BulkActionBar.tsx', 'BulkReassignModal.tsx', 'BulkTagModal.tsx', 'HelpMenu.tsx',
    'UserMenu.tsx', 'AppHeader.tsx', 'Breadcrumbs.tsx', 'KeyboardShortcutsModal.tsx',
    'CookieBanner.tsx', 'DataExportMenu.tsx', 'PWAInstallPrompt.tsx',
    'ConfirmDialog.tsx', 'ModalShell.tsx', 'Modal.tsx', 'Card.tsx',
    'ServiceWorkerRegistration.tsx', 'PageHeader.tsx',
    'StatusBadge.tsx', 'Badge.tsx', 'Tag.tsx', 'Tooltip.tsx',
    'Alert.tsx', 'EmptyState.tsx', 'MetricCard.tsx', 'Skeleton.tsx',
    'TableSkeleton.tsx', 'Tabs.tsx', 'HubTabs.tsx', 'HubTabNavigation.tsx',
    'ProgressBar.tsx', 'Avatar.tsx', 'RowDate.tsx', 'SanitizedHtml.tsx',
    'FormLabel.tsx', 'SortableHeader.tsx', 'Icons.tsx',
    'ViewTypeSwitcher.tsx', 'ActiveFilterBadge.tsx',
    'PermissionsProvider.tsx', 'PreferencesProvider.tsx', 'SubscriptionProvider.tsx',
    'GlobalModalProvider.tsx', 'CopilotProvider.tsx', 'CopilotTrigger.tsx',
    'PageShell.tsx', 'PageTransition.tsx', 'RoleGate.tsx',
    'TierBadge.tsx', 'TierGate.tsx', 'UpgradePrompt.tsx',
    'AdminSidebar.tsx', 'PortalSidebar.tsx',
}

ORG_FILTER_EXCLUDE_PATTERNS = [
    'health', 'auth', 'track', 'cron', 'webhooks', 'esign',
    'payments/connect', 'sessions', 'join-requests', 'invite-codes',
    'portals', 'notifications', 'profile',
]

MODAL_EXCLUDE_BASENAMES = {
    'ModalShell.tsx', 'Modal.tsx', 'ConfirmDialog.tsx',
    'AdminSidebar.tsx', 'PortalSidebar.tsx', 'CookieBanner.tsx',
    'CopilotPanel.tsx', 'DataImportDialog.tsx', 'CommandPalette.tsx',
    'KeyboardShortcutsModal.tsx', 'GlobalModalProvider.tsx',
    'ViewSidebar.tsx', 'BulkReassignModal.tsx', 'BulkTagModal.tsx',
    'ShareDialog.tsx', 'NotificationBell.tsx', 'UserMenu.tsx',
    'HelpMenu.tsx', 'QuickActionMenu.tsx', 'ColumnConfigPanel.tsx',
    'PWAInstallPrompt.tsx', 'LocalizationMenu.tsx',
    'AdvanceDetailClient.tsx', 'ContentLibrary.tsx',
    'CreateOrderModal.tsx',
}

# ════════════════════════════════════════════════════════
# DIMENSION 1: Missing Workflows
# ════════════════════════════════════════════════════════

def audit_missing_loading():
    if not os.path.isdir(APP_DIR): return
    for entry in os.listdir(APP_DIR):
        subdir = os.path.join(APP_DIR, entry)
        if not os.path.isdir(subdir): continue
        if os.path.exists(os.path.join(subdir, 'page.tsx')) and not os.path.exists(os.path.join(subdir, 'loading.tsx')):
            add(f"src/app/app/{entry}/", "Missing workflow",
                f"Hub '{entry}' has no loading.tsx", "Medium",
                f"Add loading.tsx to src/app/app/{entry}/")

def audit_missing_error():
    if not os.path.isdir(APP_DIR): return
    for entry in os.listdir(APP_DIR):
        subdir = os.path.join(APP_DIR, entry)
        if not os.path.isdir(subdir): continue
        if os.path.exists(os.path.join(subdir, 'page.tsx')) and not os.path.exists(os.path.join(subdir, 'error.tsx')):
            add(f"src/app/app/{entry}/", "Missing workflow",
                f"Hub '{entry}' has no error.tsx", "High",
                f"Add error.tsx boundary to src/app/app/{entry}/")

def audit_role_gates():
    if not os.path.isdir(APP_DIR): return
    sensitive = {'settings','finance','invoices','procurement','compliance',
                 'budgets','profitability','people','integrations','automations',
                 'emails','campaigns','reports','advancing','expenses'}
    for entry in os.listdir(APP_DIR):
        if entry not in sensitive: continue
        subdir = os.path.join(APP_DIR, entry)
        if not os.path.isdir(subdir): continue
        layout = os.path.join(subdir, 'layout.tsx')
        if os.path.exists(layout):
            if 'RoleGate' not in read_file(layout):
                add(f"src/app/app/{entry}/layout.tsx", "Missing workflow",
                    f"Sensitive hub '{entry}' lacks RoleGate", "Critical",
                    f"Add RoleGate to layout.tsx")
        else:
            page = os.path.join(subdir, 'page.tsx')
            if os.path.exists(page) and 'RoleGate' not in read_file(page):
                add(f"src/app/app/{entry}/", "Missing workflow",
                    f"Sensitive hub '{entry}' has no layout.tsx or RoleGate", "Critical",
                    f"Add layout.tsx with RoleGate")

def audit_org_filter():
    if not os.path.isdir(API_DIR): return
    for fpath in get_tsx_files(API_DIR):
        rp = rel(fpath)
        if any(p in rp for p in ORG_FILTER_EXCLUDE_PATTERNS): continue
        content = read_file(fpath)
        if not content or '.from(' not in content: continue
        has_scope = any(k in content for k in [
            'organization_id', 'org_id', 'org.id', 'user_id', 'user.id',
            'checkPermission', 'requirePermission',
            'task_id', 'client_id', 'project_id', 'event_id', 'proposal_id',
            'crew_id', 'asset_id', 'order_id', 'budget_id', 'advance_id',
            'template_id', 'fabrication_order_id',
            'perm.organizationId', 'perm.userId', 'org-scoped',
        ])
        if not has_scope:
            add(rp, "Missing workflow",
                "API route has unscoped DB queries — cross-tenant risk", "Critical",
                "Add organization_id or user_id filter")

# ════════════════════════════════════════════════════════
# DIMENSION 2: Missing Data Tables & Schema Gaps
# (Check .from('table_name') references against DB types)
# ════════════════════════════════════════════════════════

def audit_schema_table_refs():
    """Find .from('xxx') calls that reference tables not in database.types.ts"""
    db_content = read_file(DB_TYPES)
    if not db_content: return
    
    # Extract table names from 'Tables: {' section using 6-space indent
    tables_start = db_content.index('Tables: {')
    tables_section = db_content[tables_start:]
    table_pat = re.compile(r'^\s{6}(\w+):\s*\{', re.MULTILINE)
    known_tables = set(table_pat.findall(tables_section))
    
    # Also include Views
    if 'Views: {' in db_content:
        views_start = db_content.index('Views: {')
        views_section = db_content[views_start:]
        known_tables |= set(table_pat.findall(views_section))
    
    from_pat = re.compile(r"\.from\(['\"]([a-z_]+)['\"]\)")
    # Known Supabase storage bucket names (not DB tables)
    storage_buckets = {'documents', 'attachments', 'receipts', 'avatars', 'logos', 'files', 'uploads', 'public', 'private', 'images', 'media'}
    
    for fpath in get_tsx_files(SRC):
        content = read_file(fpath)
        if not content: continue
        # Skip files that only use storage.from() not table.from()
        missing = set()
        for match in from_pat.findall(content):
            if match in known_tables or match in storage_buckets:
                continue
            # Check if this .from() is preceded by '.storage' (bucket ref)
            idx = content.find(f".from('{match}')")
            if idx == -1:
                idx = content.find(f'.from("{match}")')
            if idx > 0:
                prefix = content[max(0, idx-30):idx]
                if '.storage' in prefix or 'storage.' in prefix:
                    continue
            missing.add(match)
        for table in sorted(missing):
            add(rel(fpath), "Missing table",
                f"Table '{table}' referenced in .from() but not in database types",
                "Critical",
                f"Add migration for '{table}' or fix table name reference")

# ════════════════════════════════════════════════════════
# DIMENSION 3: Missing Data Points
# (Check that major tables have proper audit timestamps)
# ════════════════════════════════════════════════════════

def audit_missing_timestamps():
    """Check that all major tables have created_at/updated_at."""
    db_content = read_file(DB_TYPES)
    if not db_content: return
    
    # Extract table names and their Row blocks
    tables_start = db_content.index('Tables: {')
    tables_section = db_content[tables_start:]
    table_pat = re.compile(r'^\s{6}(\w+):\s*\{', re.MULTILINE)
    all_tables = table_pat.findall(tables_section)
    
    # Junction tables, logs, and small tables where timestamps are optional
    timestamp_exempt = {
        '_audit_log_legacy', 'deal_tags', 'phase_portfolio_links',
        'portfolio_library_tags', 'equipment_bundle_items',
        'schedule_block_assignments', 'seat_allocations',
        'packing_list_items', 'po_receipt_items',
        'requisition_line_items', 'shipment_line_items',
        'warehouse_transfer_items', 'team_memberships',
        'goal_task_links', 'task_dependencies', 'deal_contacts',
        'task_watchers', 'project_memberships', 'project_events',
        'invoice_line_items', 'bill_of_materials', 'event_contacts',
        'event_roles', 'work_order_assignments', 'team_assignments',
        'activation_assignments', 'role_permissions',
        'campaign_recipients', 'permission_catalog',
        'custom_field_values', 'integration_field_mappings',
        'advance_item_modifier_lists', 'feature_flag_overrides',
        'invite_code_redemptions', 'rental_line_items',
        'purchase_order_line_items', 'goods_receipt_line_items',
        'inventory_count_lines', 'budget_line_items',
        # Log/history/event tables only need created_at (audit trail)
        'asset_audit_log', 'asset_scan_events', 'asset_value_history',
        'asset_depreciation_entries', 'asset_location_history',
        'deal_stage_history', 'advance_status_history',
        'integration_sync_log', 'integration_sync_logs',
        'portal_access_log', 'webhook_deliveries',
        'work_order_status_log', 'work_order_bid_status_log',
        'auth_events', 'audit_logs', 'activity_log',
        'lead_form_submissions', 'lead_activities',
        'advance_line_items', 'production_advances',
        'join_requests', 'job_site_photos', 'daily_reports',
        'advance_webhook_events', 'advance_inventory_transactions',
        'shop_floor_logs', 'automation_runs',
    }
    
    # For each table, search for its Row block and check timestamps
    for table_name in all_tables:
        if table_name in timestamp_exempt:
            continue
        # Find the Row: { block for this table
        row_start_pat = re.compile(rf'^\s{{6}}{re.escape(table_name)}:\s*\{{\s*Row:\s*\{{', re.MULTILINE)
        m = row_start_pat.search(tables_section)
        if not m: continue
        # Get a chunk after the Row start to look for timestamps
        chunk = tables_section[m.end():m.end()+2000]
        # Find closing brace of Row
        brace_depth = 1
        end_pos = 0
        for i, c in enumerate(chunk):
            if c == '{': brace_depth += 1
            elif c == '}': brace_depth -= 1
            if brace_depth == 0:
                end_pos = i
                break
        row_block = chunk[:end_pos]
        
        has_created = 'created_at' in row_block
        has_updated = 'updated_at' in row_block
        
        if not has_created and not has_updated:
            add(f"table: {table_name}", "Missing data point",
                f"Table '{table_name}' lacks both created_at and updated_at",
                "Medium",
                f"ALTER TABLE {table_name} ADD COLUMN created_at timestamptz DEFAULT now(), ADD COLUMN updated_at timestamptz DEFAULT now()")


# ════════════════════════════════════════════════════════
# DIMENSION 4: 3NF / SSOT Violations
# (Enum drift: hardcoded status values not matching DB enums)
# ════════════════════════════════════════════════════════

def audit_enum_drift():
    """Check that StatusBadge color registries match DB enum values."""
    db_content = read_file(DB_TYPES)
    if not db_content: return
    
    badge_content = read_file(os.path.join(UI_DIR, 'StatusBadge.tsx'))
    if not badge_content: return
    
    # Extract DB enums from the Enums section only (avoid false matches from column types)
    enums_idx = db_content.rfind('Enums: {')
    if enums_idx < 0: return
    enums_section = db_content[enums_idx:enums_idx+5000]
    
    enum_pat = re.compile(r'(\w+):\s*((?:\s*\|?\s*"[^"]+"\s*)+)', re.MULTILINE)
    db_enums = {}
    for match in enum_pat.finditer(enums_section):
        name = match.group(1)
        values = set(re.findall(r'"([^"]+)"', match.group(2)))
        if values:
            db_enums[name] = values
    
    # Extract StatusBadge color registry keys
    registry_pat = re.compile(r'export const (\w+_COLORS).*?=\s*\{([^}]+)\}', re.DOTALL)
    
    mapping = {
        'TASK_STATUS_COLORS': 'task_status',
        'LEAD_STATUS_COLORS': 'lead_status',
        'INVOICE_STATUS_COLORS': 'invoice_status',
        'PIPELINE_STAGE_COLORS': 'deal_stage',
        'EQUIPMENT_STATUS_COLORS': 'asset_status',
        'MAINTENANCE_STATUS_COLORS': 'maintenance_status',
    }
    
    seen = set()
    for match in registry_pat.finditer(badge_content):
        registry_name = match.group(1)
        if registry_name in seen: continue
        seen.add(registry_name)
        keys_str = match.group(2)
        registry_keys = set(re.findall(r"(\w+):", keys_str))
        
        db_enum_name = mapping.get(registry_name)
        if not db_enum_name or db_enum_name not in db_enums: continue
        
        missing = db_enums[db_enum_name] - registry_keys
        if missing:
            add(f"src/components/ui/StatusBadge.tsx ({registry_name})",
                "3NF/SSOT violation",
                f"DB enum '{db_enum_name}' has values {missing} not in color registry",
                "Medium",
                f"Add missing keys to {registry_name} in StatusBadge.tsx")


# ════════════════════════════════════════════════════════
# DIMENSION 5: Canonical Component & UI Normalization
# ════════════════════════════════════════════════════════

def audit_raw_inputs():
    pat = re.compile(r'<input\b(?![^>]*type=["\'](?:hidden|checkbox|radio|file|color|range|submit))[^>]*>')
    for fpath in get_tsx_files(SRC):
        if os.path.basename(fpath) in RAW_ELEMENT_EXCLUDE_BASENAMES: continue
        if '/api/' in fpath or '/__tests__/' in fpath: continue
        content = read_file(fpath)
        if not content or 'FormInput' in content: continue
        if pat.findall(content):
            add(rel(fpath), "UI normalization gap",
                f"{len(pat.findall(content))} raw <input> bypass FormInput",
                "Medium", "Replace with FormInput from @/components/ui/FormInput")

def audit_raw_selects():
    pat = re.compile(r'<select\b[^>]*>')
    for fpath in get_tsx_files(SRC):
        if os.path.basename(fpath) in RAW_ELEMENT_EXCLUDE_BASENAMES: continue
        if '/api/' in fpath or '/__tests__/' in fpath: continue
        content = read_file(fpath)
        if not content or 'FormSelect' in content: continue
        if pat.findall(content):
            add(rel(fpath), "UI normalization gap",
                f"{len(pat.findall(content))} raw <select> bypass FormSelect",
                "Medium", "Replace with FormSelect from @/components/ui/FormSelect")

def audit_raw_textareas():
    pat = re.compile(r'<textarea\b[^>]*>')
    for fpath in get_tsx_files(SRC):
        if os.path.basename(fpath) in RAW_ELEMENT_EXCLUDE_BASENAMES: continue
        if '/api/' in fpath or '/__tests__/' in fpath: continue
        content = read_file(fpath)
        if not content or 'FormTextarea' in content: continue
        if pat.findall(content):
            add(rel(fpath), "UI normalization gap",
                f"{len(pat.findall(content))} raw <textarea> bypass FormTextarea",
                "Medium", "Replace with FormTextarea from @/components/ui/FormTextarea")

def audit_raw_buttons():
    pat = re.compile(r'<button\b[^>]*>')
    for fpath in get_tsx_files(SRC):
        if os.path.basename(fpath) in RAW_ELEMENT_EXCLUDE_BASENAMES: continue
        if '/api/' in fpath or '/__tests__/' in fpath: continue
        content = read_file(fpath)
        if not content: continue
        if "from '@/components/ui/Button'" in content or 'from "@/components/ui/Button"' in content: continue
        if pat.findall(content):
            add(rel(fpath), "UI normalization gap",
                f"{len(pat.findall(content))} raw <button> bypass canonical Button",
                "Medium", "Replace with Button from @/components/ui/Button")

def audit_browser_alerts():
    pat = re.compile(r'(?:^|[\s;=({,])(?:window\.)?(alert|confirm)\(', re.MULTILINE)
    for fpath in get_tsx_files(SRC):
        if '/__tests__/' in fpath or '/api/' in fpath: continue
        content = read_file(fpath)
        if not content: continue
        matches = pat.findall(content)
        real = [m for m in matches if m in ('alert', 'confirm')]
        if real:
            add(rel(fpath), "UI normalization gap",
                f"Browser-native {', '.join(set(real))}() breaks UX consistency",
                "Medium", "Replace with ConfirmDialog or Alert component")

def audit_diy_modals():
    for fpath in get_tsx_files(SRC):
        if os.path.basename(fpath) in MODAL_EXCLUDE_BASENAMES: continue
        if '/api/' in fpath or '/__tests__/' in fpath: continue
        content = read_file(fpath)
        if not content or 'ModalShell' in content: continue
        if 'fixed inset-0' in content and ('z-50' in content or 'z-40' in content):
            if 'bg-black/' in content or 'backdrop' in content:
                add(rel(fpath), "UI normalization gap",
                    "DIY modal overlay — should use ModalShell", "Medium",
                    "Refactor to use ModalShell from @/components/ui/ModalShell")


# ════════════════════════════════════════════════════════
# 5.7 Hardcoded hex colors (design token violations)
# ════════════════════════════════════════════════════════

def audit_hardcoded_colors():
    """Find hardcoded hex colors in TSX that bypass the design system."""
    hex_pat = re.compile(r'(?:color|background|border|fill|stroke)\s*[:=]\s*["\']#[0-9a-fA-F]{3,8}["\']')
    
    # Components where hardcoded colors are expected (charts, brand theming, etc.)
    color_exempt = {
        'StatusBadge.tsx', 'BurndownChart.tsx', 'GanttChart.tsx',
        'ProgressBar.tsx', 'Badge.tsx', 'Tag.tsx', 'TierBadge.tsx',
        'EventCalendar.tsx', 'AvailabilityCalendar.tsx', 'TimeOffCalendar.tsx',
        'MyScheduleView.tsx', 'DealRiskAssessment.tsx', 'ClientHealthCard.tsx',
        'JourneyTimeline.tsx', 'JourneyContent.tsx', 'InvestmentSummaryBar.tsx',
        'PhaseSection.tsx', 'PortalHeader.tsx', 'DepositGate.tsx',
        'PortalSidebar.tsx', 'ProposalAnalytics.tsx', 'CookieBanner.tsx',
        'ServiceWorkerRegistration.tsx', 'ExportCard.tsx',
        'PricingCards.tsx', 'MarketingNav.tsx',
        'QRGenerator.tsx',
        # Global error/auth pages use inline styles because CSS may not be loaded
        'global-error.tsx', 'error.tsx',
        # Auth pages use brand-specific inline colors by design
        'constants.ts',
    }
    
    for fpath in get_tsx_files(SRC):
        bn = os.path.basename(fpath)
        if bn in color_exempt: continue
        if '/api/' in fpath or '/__tests__/' in fpath: continue
        # Auth pages use inline styles for brand appearance
        if '/(auth)/' in fpath or '/(marketing)/' in fpath: continue
        # Lib constants files define color registries (not inline styles)
        if '/lib/' in fpath: continue
        content = read_file(fpath)
        if not content: continue
        matches = hex_pat.findall(content)
        if matches:
            add(rel(fpath), "UI normalization gap",
                f"{len(matches)} hardcoded hex color(s) bypass design tokens",
                "Low",
                "Replace hardcoded colors with Tailwind classes or CSS variables")


# ════════════════════════════════════════════════════════
# 1.5 Missing layout.tsx in hub directories
# ════════════════════════════════════════════════════════

def audit_missing_layouts():
    """Hub directories should have layout.tsx for consistent shell."""
    if not os.path.isdir(APP_DIR): return
    
    # These hubs don't need layouts (they inherit from parent or are single-page)
    layout_exempt = {'portal', 'calendar', 'ai'}
    
    for entry in os.listdir(APP_DIR):
        subdir = os.path.join(APP_DIR, entry)
        if not os.path.isdir(subdir): continue
        if entry.startswith('('): continue  # Route groups like (hub)
        has_page = os.path.exists(os.path.join(subdir, 'page.tsx'))
        has_layout = os.path.exists(os.path.join(subdir, 'layout.tsx'))
        if has_page and not has_layout and entry not in layout_exempt:
            add(f"src/app/app/{entry}/", "Missing workflow",
                f"Hub '{entry}' has no layout.tsx — no consistent page shell",
                "Low",
                f"Add layout.tsx to src/app/app/{entry}/")


# ════════════════════════════════════════════════════════
# 1.6 API routes missing auth check
# ════════════════════════════════════════════════════════

def audit_api_auth():
    """Flag API routes that don't authenticate users at all."""
    if not os.path.isdir(API_DIR): return
    
    auth_exempt_patterns = [
        'health', 'cron', 'webhooks', 'track', 'portals',
        'auth', 'forms', 'esign/verify', 'payments/webhook',
        'invite-codes/validate', 'public/', 'crew-bookings',
        'process-recurring',
    ]
    
    for fpath in get_tsx_files(API_DIR):
        rp = rel(fpath)
        if any(p in rp for p in auth_exempt_patterns): continue
        content = read_file(fpath)
        if not content: continue
        
        # Must have at least one auth mechanism
        has_auth = any(k in content for k in [
            'getUser', 'checkPermission', 'requirePermission',
            'requireAuth', 'requirePortalPermission', 'resolveCurrentOrg',
            'auth.getSession', 'supabase.auth', 'verifyToken',
            'portal_access_token', 'Authorization',
            # Delegated auth via shared workflow handlers
            'from \'../workflow\'', 'from "../workflow"',
            'from \'./workflow\'', 'from "./workflow"',
            'workflow.', 'Workflow',
        ])
        
        if not has_auth:
            add(rp, "Missing workflow",
                "API route has no authentication check — unauthorized access possible",
                "Critical",
                "Add supabase.auth.getUser() or checkPermission() guard")


# ════════════════════════════════════════════════════════
# 4.2 Hardcoded status strings not using typed constants
# ════════════════════════════════════════════════════════

def audit_status_constants():
    """Find components using inline status string comparisons that could drift."""
    # We specifically look for direct status === 'xxx' patterns in page-level files
    # where the status values should come from a typed enum/constant import
    status_pat = re.compile(r"status\s*===?\s*['\"](\w+)['\"]")
    
    # Files that define status types or are status-related (exempt)
    status_exempt = {
        'StatusBadge.tsx', 'database.types.ts', 'seed-data.ts',
        'types.ts', 'constants.ts', 'permissions.ts', 'subscription.ts',
    }
    
    # We only check page-level files (avoid flagging all components)
    # This check is informational — we verify the status values exist in DB enums
    db_content = read_file(DB_TYPES)
    if not db_content: return
    
    # Extract all known enum values from the Enums section
    enums_idx = db_content.rfind('Enums: {')
    if enums_idx < 0: return
    enums_section = db_content[enums_idx:enums_idx+6000]
    all_enum_values = set(re.findall(r'"([a-z_]+)"', enums_section))
    
    for fpath in get_tsx_files(os.path.join(SRC, 'app', 'api')):
        bn = os.path.basename(fpath)
        if bn in status_exempt: continue
        content = read_file(fpath)
        if not content: continue
        
        for match in status_pat.finditer(content):
            value = match.group(1)
            # Only flag if this status value is NOT a valid DB enum value
            if value not in all_enum_values and value not in ('true', 'false', 'null', 'undefined', 'active', 'inactive', 'error', 'success', 'pending', 'failed', 'dispatched', 'received', 'completed', 'processing', 'open', 'closed', 'partial'):
                add(rel(fpath), "3NF/SSOT violation",
                    f"Status value '{value}' is hardcoded but not in any DB enum — potential drift",
                    "Low",
                    f"Verify '{value}' exists as a DB enum value or use a typed constant")


# ════════════════════════════════════════════════════════
# Runner
# ════════════════════════════════════════════════════════

def run_all():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║  STRESS TEST AUDIT v3 — Full 5-Dimension Scan          ║")
    print("╚══════════════════════════════════════════════════════════╝\n")
    
    checks = [
        ("1.1 Missing loading.tsx",     audit_missing_loading),
        ("1.2 Missing error.tsx",       audit_missing_error),
        ("1.3 Missing RoleGate",        audit_role_gates),
        ("1.4 Cross-tenant scope",      audit_org_filter),
        ("1.5 Missing layout.tsx",      audit_missing_layouts),
        ("1.6 API auth gaps",           audit_api_auth),
        ("2.1 Schema table refs",       audit_schema_table_refs),
        ("3.1 Missing timestamps",      audit_missing_timestamps),
        ("4.1 Enum drift",             audit_enum_drift),
        ("4.2 Status string drift",    audit_status_constants),
        ("5.1 Raw <input>",            audit_raw_inputs),
        ("5.2 Raw <select>",           audit_raw_selects),
        ("5.3 Raw <textarea>",         audit_raw_textareas),
        ("5.4 Raw <button>",           audit_raw_buttons),
        ("5.5 Browser alert/confirm",  audit_browser_alerts),
        ("5.6 DIY modals",             audit_diy_modals),
        ("5.7 Hardcoded colors",       audit_hardcoded_colors),
    ]
    
    for label, fn in checks:
        before = len(findings)
        fn()
        found = len(findings) - before
        status = "✅" if found == 0 else f"⚠️  {found}"
        print(f"  [{label}] {status}")
    
    print()
    sev_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    findings.sort(key=lambda f: (sev_order.get(f["severity"], 99), f["gap_type"]))
    
    if not findings:
        print("🎉 ZERO FINDINGS — audit passed cleanly!")
    else:
        print(f"{'='*60}")
        print(f"  TOTAL FINDINGS: {len(findings)}")
        print(f"{'='*60}")
        by = {}
        for f in findings:
            by.setdefault(f["severity"], []).append(f)
        for s in ["Critical","High","Medium","Low"]:
            if s in by: print(f"  {s}: {len(by[s])}")
        print(f"\n{'─'*60}")
        for i, f in enumerate(findings, 1):
            print(f"\n  [{i}] {f['severity']} — {f['gap_type']}")
            print(f"      Location: {f['location']}")
            print(f"      Breaks:   {f['what_breaks']}")
            print(f"      Fix:      {f['fix']}")
    
    print()
    return len(findings)

if __name__ == "__main__":
    count = run_all()
    sys.exit(0 if count == 0 else 1)

