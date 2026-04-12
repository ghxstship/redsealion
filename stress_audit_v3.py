#!/usr/bin/env python3
"""
STRESS TEST AUDIT v3 — Operational, Structural & Normalization Gap Audit
Checks 5 dimensions with low false-positive rates.
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

# ─── KNOWN EXCLUSION SETS ───
# Files that ARE canonical components or legitimately use raw HTML elements
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

# Modal overlay exclusions - components that ARE modals/sidebars by design
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

# API routes that legitimately don't need org_id filtering
ORG_FILTER_EXCLUDE_PATTERNS = [
    'health', 'auth', 'track', 'cron', 'webhooks', 'esign',
    'payments/connect', 'sessions', 'join-requests', 'invite-codes',
    'portals', 'notifications', 'profile',
]


# ═══════════════════════════════════════════════════════════════
# 5.1 Raw <input> without FormInput
# ═══════════════════════════════════════════════════════════════
def audit_raw_inputs():
    """Find raw <input type=text/number/etc> that should use FormInput."""
    pat = re.compile(r'<input\b(?![^>]*type=["\'](?:hidden|checkbox|radio|file|color|range|submit))[^>]*>')
    
    for fpath in get_tsx_files(SRC):
        bn = os.path.basename(fpath)
        if bn in RAW_ELEMENT_EXCLUDE_BASENAMES:
            continue
        if '/api/' in fpath or '/__tests__/' in fpath:
            continue
        content = read_file(fpath)
        if not content or 'FormInput' in content:
            continue
        
        matches = pat.findall(content)
        if matches:
            add(rel(fpath), "UI normalization gap",
                f"{len(matches)} raw <input> element(s) bypass canonical FormInput",
                "High" if len(matches) >= 3 else "Medium",
                "Replace raw <input> with FormInput from @/components/ui/FormInput")


# ═══════════════════════════════════════════════════════════════
# 5.2 Raw <select> without FormSelect
# ═══════════════════════════════════════════════════════════════
def audit_raw_selects():
    pat = re.compile(r'<select\b[^>]*>')
    
    for fpath in get_tsx_files(SRC):
        bn = os.path.basename(fpath)
        if bn in RAW_ELEMENT_EXCLUDE_BASENAMES:
            continue
        if '/api/' in fpath or '/__tests__/' in fpath:
            continue
        content = read_file(fpath)
        if not content or 'FormSelect' in content:
            continue
        
        matches = pat.findall(content)
        if matches:
            add(rel(fpath), "UI normalization gap",
                f"{len(matches)} raw <select> element(s) bypass canonical FormSelect",
                "High" if len(matches) >= 3 else "Medium",
                "Replace raw <select> with FormSelect from @/components/ui/FormSelect")


# ═══════════════════════════════════════════════════════════════
# 5.3 Raw <textarea> without FormTextarea
# ═══════════════════════════════════════════════════════════════
def audit_raw_textareas():
    pat = re.compile(r'<textarea\b[^>]*>')
    
    for fpath in get_tsx_files(SRC):
        bn = os.path.basename(fpath)
        if bn in RAW_ELEMENT_EXCLUDE_BASENAMES:
            continue
        if '/api/' in fpath or '/__tests__/' in fpath:
            continue
        content = read_file(fpath)
        if not content or 'FormTextarea' in content:
            continue
        
        matches = pat.findall(content)
        if matches:
            add(rel(fpath), "UI normalization gap",
                f"{len(matches)} raw <textarea> element(s) bypass canonical FormTextarea",
                "Medium",
                "Replace raw <textarea> with FormTextarea from @/components/ui/FormTextarea")


# ═══════════════════════════════════════════════════════════════
# 5.4 Raw <button> without Button
# ═══════════════════════════════════════════════════════════════
def audit_raw_buttons():
    pat = re.compile(r'<button\b[^>]*>')
    
    for fpath in get_tsx_files(SRC):
        bn = os.path.basename(fpath)
        if bn in RAW_ELEMENT_EXCLUDE_BASENAMES:
            continue
        if '/api/' in fpath or '/__tests__/' in fpath:
            continue
        content = read_file(fpath)
        if not content:
            continue
        # Skip if the file imports the canonical Button
        if "from '@/components/ui/Button'" in content or 'from "@/components/ui/Button"' in content:
            continue
        
        matches = pat.findall(content)
        if matches:
            add(rel(fpath), "UI normalization gap",
                f"{len(matches)} raw <button> element(s) bypass canonical Button",
                "High" if len(matches) >= 3 else "Medium",
                "Replace raw <button> with Button from @/components/ui/Button")


# ═══════════════════════════════════════════════════════════════
# 5.5 Browser-native alert/confirm
# ═══════════════════════════════════════════════════════════════
def audit_browser_alerts():
    # Require alert/confirm to appear as standalone call with no space before paren
    # e.g. match "alert(" or "window.alert(" but not "reservationAlert(" or "alert (internal)"
    pat = re.compile(r'(?:^|[\s;=({,])(?:window\.)?(alert|confirm)\(', re.MULTILINE)
    
    for fpath in get_tsx_files(SRC):
        if '/__tests__/' in fpath or '/api/' in fpath:
            continue
        content = read_file(fpath)
        if not content:
            continue
        
        matches = pat.findall(content)
        if matches:
            real_matches = [m for m in matches if m in ('alert', 'confirm')]
            if real_matches:
                add(rel(fpath), "UI normalization gap",
                    f"Browser-native {', '.join(set(real_matches))}() — breaks UX consistency",
                    "Medium",
                    "Replace with ConfirmDialog or Alert component from design system")


# ═══════════════════════════════════════════════════════════════
# 1.1 Missing loading.tsx in hub directories
# ═══════════════════════════════════════════════════════════════
def audit_missing_loading():
    if not os.path.isdir(APP_DIR):
        return
    for entry in os.listdir(APP_DIR):
        subdir = os.path.join(APP_DIR, entry)
        if not os.path.isdir(subdir):
            continue
        has_page = os.path.exists(os.path.join(subdir, 'page.tsx'))
        has_loading = os.path.exists(os.path.join(subdir, 'loading.tsx'))
        if has_page and not has_loading:
            add(f"src/app/app/{entry}/",
                "Missing workflow",
                f"Hub '{entry}' has no loading.tsx — blank screen during navigation",
                "Medium",
                f"Add loading.tsx with TableSkeleton to src/app/app/{entry}/")


# ═══════════════════════════════════════════════════════════════
# 1.2 Missing error.tsx in hub directories
# ═══════════════════════════════════════════════════════════════
def audit_missing_error():
    if not os.path.isdir(APP_DIR):
        return
    for entry in os.listdir(APP_DIR):
        subdir = os.path.join(APP_DIR, entry)
        if not os.path.isdir(subdir):
            continue
        has_page = os.path.exists(os.path.join(subdir, 'page.tsx'))
        has_error = os.path.exists(os.path.join(subdir, 'error.tsx'))
        if has_page and not has_error:
            add(f"src/app/app/{entry}/",
                "Missing workflow",
                f"Hub '{entry}' has no error.tsx — errors crash entire page",
                "High",
                f"Add error.tsx boundary to src/app/app/{entry}/")


# ═══════════════════════════════════════════════════════════════
# 1.3 Missing RoleGate on sensitive hubs
# ═══════════════════════════════════════════════════════════════
def audit_role_gates():
    if not os.path.isdir(APP_DIR):
        return
    sensitive_hubs = {
        'settings', 'finance', 'invoices', 'procurement', 'compliance',
        'budgets', 'profitability', 'people', 'integrations', 'automations',
        'emails', 'campaigns', 'reports', 'advancing', 'expenses',
    }
    for entry in os.listdir(APP_DIR):
        if entry not in sensitive_hubs:
            continue
        subdir = os.path.join(APP_DIR, entry)
        if not os.path.isdir(subdir):
            continue
        layout = os.path.join(subdir, 'layout.tsx')
        if os.path.exists(layout):
            content = read_file(layout)
            if 'RoleGate' not in content:
                add(f"src/app/app/{entry}/layout.tsx",
                    "Missing workflow",
                    f"Sensitive hub '{entry}' lacks RoleGate — unauthorized access possible",
                    "Critical",
                    f"Wrap children with <RoleGate resource=\"{entry}\"> in layout.tsx")
        else:
            page = os.path.join(subdir, 'page.tsx')
            if os.path.exists(page):
                content = read_file(page)
                if 'RoleGate' not in content:
                    add(f"src/app/app/{entry}/",
                        "Missing workflow",
                        f"Sensitive hub '{entry}' has no layout.tsx or RoleGate",
                        "Critical",
                        f"Add layout.tsx with RoleGate to src/app/app/{entry}/")


# ═══════════════════════════════════════════════════════════════
# 1.4 Cross-tenant data leak — API routes missing org_id
# Only flag routes that do write operations (insert/update/delete)
# or bulk reads without user_id scoping
# ═══════════════════════════════════════════════════════════════
def audit_org_filter():
    if not os.path.isdir(API_DIR):
        return
    
    for fpath in get_tsx_files(API_DIR):
        rp = rel(fpath)
        
        # Skip routes that legitimately don't need org scoping
        skip = False
        for pattern in ORG_FILTER_EXCLUDE_PATTERNS:
            if pattern in rp:
                skip = True
                break
        if skip:
            continue
        
        content = read_file(fpath)
        if not content:
            continue
        
        # Only flag if doing DB queries without any scoping
        has_db_query = '.from(' in content
        if not has_db_query:
            continue
        
        has_org = 'organization_id' in content or 'org_id' in content or 'org.id' in content
        has_user = 'user_id' in content or 'user.id' in content
        # checkPermission/requirePermission provide org-scoped auth context
        has_perm_guard = 'checkPermission' in content or 'requirePermission' in content
        # Child-entity routes scoped by parent ID (e.g., /tasks/[id]/comments)
        has_parent_scope = any(p in content for p in [
            'task_id', 'client_id', 'project_id', 'event_id', 'proposal_id',
            'crew_id', 'asset_id', 'order_id', 'budget_id', 'advance_id',
            'template_id', 'fabrication_order_id',
            'perm.organizationId', 'perm.userId', 'org-scoped',
        ])
        
        # If any scoping mechanism is present, it's ok
        if has_org or has_user or has_perm_guard or has_parent_scope:
            continue
        
        add(rp, "Missing workflow",
            "API route has DB queries without organization_id or user_id filter — cross-tenant risk",
            "Critical",
            "Add .eq('organization_id', org.id) to all queries")


# ═══════════════════════════════════════════════════════════════
# 5.6 DIY modal overlay patterns
# ═══════════════════════════════════════════════════════════════
def audit_diy_modals():
    for fpath in get_tsx_files(SRC):
        bn = os.path.basename(fpath)
        if bn in MODAL_EXCLUDE_BASENAMES:
            continue
        if '/api/' in fpath or '/__tests__/' in fpath:
            continue
        content = read_file(fpath)
        if not content or 'ModalShell' in content:
            continue
        
        if 'fixed inset-0' in content and ('z-50' in content or 'z-40' in content):
            if 'bg-black/' in content or 'backdrop' in content:
                add(rel(fpath), "UI normalization gap",
                    "DIY modal overlay — should use canonical ModalShell",
                    "Medium",
                    "Refactor to use ModalShell from @/components/ui/ModalShell")


# ═══════════════════════════════════════════════════════════════
# Run
# ═══════════════════════════════════════════════════════════════
def run_all():
    print("╔══════════════════════════════════════════════╗")
    print("║  STRESS TEST AUDIT v3 — Running all checks  ║")
    print("╚══════════════════════════════════════════════╝\n")
    
    checks = [
        ("5.1 Raw <input>", audit_raw_inputs),
        ("5.2 Raw <select>", audit_raw_selects),
        ("5.3 Raw <textarea>", audit_raw_textareas),
        ("5.4 Raw <button>", audit_raw_buttons),
        ("5.5 Browser alert/confirm", audit_browser_alerts),
        ("1.1 Missing loading.tsx", audit_missing_loading),
        ("1.2 Missing error.tsx", audit_missing_error),
        ("1.3 Missing RoleGate", audit_role_gates),
        ("1.4 Cross-tenant/org_id", audit_org_filter),
        ("5.6 DIY modals", audit_diy_modals),
    ]
    
    for label, fn in checks:
        before = len(findings)
        fn()
        found = len(findings) - before
        status = "✅" if found == 0 else f"⚠️  {found}"
        print(f"  [{label}] {status}")
    
    print()
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    findings.sort(key=lambda f: (severity_order.get(f["severity"], 99), f["gap_type"]))
    
    if not findings:
        print("🎉 ZERO FINDINGS — audit passed cleanly!")
    else:
        print(f"{'='*70}")
        print(f"  TOTAL FINDINGS: {len(findings)}")
        print(f"{'='*70}")
        
        by_sev = {}
        for f in findings:
            by_sev.setdefault(f["severity"], []).append(f)
        for sev in ["Critical", "High", "Medium", "Low"]:
            items = by_sev.get(sev, [])
            if items:
                print(f"  {sev}: {len(items)}")
        
        print(f"\n{'─'*70}")
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
