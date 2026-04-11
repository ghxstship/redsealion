import os
import re

MODULES = ['compliance', 'crew', 'dispatch', 'emails', 'equipment', 'events', 'expenses', 'fabrication']
BASE_DIR = 'src/app/app'

findings = []

def add_finding(loc, gap_type, impact, severity, fix):
    findings.append({
        'Location': loc,
        'Gap type': gap_type,
        'What breaks': impact,
        'Severity': severity,
        'Fix': fix
    })

def scan_file(filepath, module):
    with open(filepath, 'r') as f:
        content = f.read()

    rel_path = os.path.relpath(filepath, BASE_DIR)
    
    # Check for RoleGate
    if filepath.endswith('page.tsx') or filepath.endswith('layout.tsx'):
        if 'RoleGate' not in content and 'error.tsx' not in filepath and 'loading.tsx' not in filepath:
            # Maybe it's gated in layout? If it's a page and there's no layout with a gate, it's a gap.
            pass # We'll do a module-level check later

    # Check for cross-tenant data exposure (missing organization_id) in get_xxx queries for details
    if '[id]/page.tsx' in filepath:
        if '.eq(\'organization_id\'' not in content and 'ctx.organizationId' not in content:
            add_finding(rel_path, '3NF/SSOT violation (Security Data Leak)', 'Cross-tenant data exposure - users can view records of other orgs by guessing IDs', 'Critical', f'Add .eq("organization_id", ctx.organizationId) to DB queries in {rel_path}')

    # Check for inline status badges
    if 'className=' in content and 'bg-' in content and 'rounded-full' in content and 'text-xs' in content and 'StatusBadge' not in content:
        matches = len(re.findall(r'bg-(?:green|red|blue|amber|yellow|purple|rose|zinc)-\d+.*rounded-full', content))
        if matches > 0:
            add_finding(rel_path, 'UI normalization gap', 'Inline status badges duplicate core styling and cause drift', 'High', 'Replace inline <span> badges with canonical <StatusBadge>')

    # Check for raw input buttons
    if '<button' in content and 'Button' not in content:
        add_finding(rel_path, 'UI normalization gap', 'Raw <button> tags used instead of canonical <Button>', 'Medium', 'Import and use canonical <Button> component')

    # Check for raw inputs
    if '<input' in content and 'FormInput' not in content and 'checkbox' not in content and 'radio' not in content:
        add_finding(rel_path, 'UI normalization gap', 'Raw <input> tags used instead of canonical <FormInput>', 'Medium', 'Import and use canonical <FormInput> and <FormLabel>')

    # Check for raw stat cards
    if 'text-2xl' in content and ('MetricCard' not in content) and ('stats' in content.lower() or 'tabular-nums' in content):
        add_finding(rel_path, 'UI normalization gap', 'Inline stat cards duplicate MetricCard', 'High', 'Replace with <MetricCard>')
        
    # Check for duplicates of formatStatus/formatLabel
    if 'function formatStatus' in content or 'function formatLabel' in content:
        add_finding(rel_path, '3NF/SSOT violation', 'Duplicate formatting utility instead of shared core function', 'High', 'Use formatLabel from @/lib/utils')

    # Check for missing deleted_at
    if 'deleted_at' not in content and '.select(' in content and '.is(' not in content:
        # Rough heuristic, refine later
        pass

for module in MODULES:
    mod_path = os.path.join(BASE_DIR, module)
    if not os.path.exists(mod_path):
        continue
    
    # Module-level RoleGate check
    has_layout_gate = False
    layout_path = os.path.join(mod_path, 'layout.tsx')
    hub_layout_path = os.path.join(mod_path, '(hub)', 'layout.tsx')
    
    if os.path.exists(layout_path) and 'RoleGate' in open(layout_path).read(): has_layout_gate = True
    elif os.path.exists(hub_layout_path) and 'RoleGate' in open(hub_layout_path).read(): has_layout_gate = True
        
    for root, dirs, files in os.walk(mod_path):
        for file in files:
            filepath = os.path.join(root, file)
            if file.endswith('.tsx') or file.endswith('.ts'):
                scan_file(filepath, module)
                
                # Report missing rolegate if not covered by layout
                rel_path = os.path.relpath(filepath, BASE_DIR)
                content = open(filepath).read()
                if file == 'page.tsx' and 'error' not in filepath and 'loading' not in filepath:
                    is_hub = '(hub)' in filepath
                    gate_covered = has_layout_gate
                    if not gate_covered and 'RoleGate' not in content:
                        add_finding(rel_path, 'Missing workflow (Access Control)', 'Module lacks RBAC. Unauthorized users can access features.', 'Critical', f'Wrap with <RoleGate> in {rel_path} or layout')

                # Check for HubTabs duplication
                if 'HubTabs' in file and 'import HubTabs' not in content and 'Tabs' in content:
                     add_finding(rel_path, 'UI normalization gap', 'Duplicate HubTabs boilerplate', 'Medium', 'Refactor to use generic HubTabs from components/shared')
                     
                # Check for TableSkeleton duplication
                if file == 'loading.tsx' and 'TableSkeleton' not in content:
                     add_finding(rel_path, 'UI normalization gap', 'Duplicate skeleton loading boilerplate', 'Medium', 'Refactor to use canonical TableSkeleton')

import json
print(json.dumps(findings, indent=2))
