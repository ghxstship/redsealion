import os
import re
import sys
import json

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
    
    # 1. Cross-tenant data exposure in [id]/page.tsx server components
    if '[id]/page.tsx' in filepath:
        if '.eq(' not in content and 'ctx.organizationId' not in content:
            # Maybe it doesn't query the DB, let's check for supabase
            if 'supabase' in content and 'from(' in content and 'select(' in content:
                if '.eq(\'organization_id\'' not in content and 'organizationId' not in content:
                    add_finding(rel_path, '3NF/SSOT violation (Security Data Leak)', 'Cross-tenant data exposure - users can view records of other orgs by guessing IDs', 'Critical', f'Add .eq("organization_id", ctx.organizationId) to DB queries in {rel_path}')

    # 2. Inline status badges instead of <StatusBadge>
    if 'className=' in content and 'rounded-full' in content and 'text-xs' in content and 'StatusBadge' not in content:
        matches = len(re.findall(r'bg-(?:green|red|blue|amber|yellow|purple|rose|zinc)-\d+.*rounded-full', content))
        if matches > 0:
            add_finding(rel_path, 'UI normalization gap', 'Inline status badges duplicate core styling and cause drift', 'High', 'Replace inline <span> badges with canonical <StatusBadge>')

    # 3. Raw <button> tags
    if '<button' in content and 'Button' not in content:
        # Avoid pages where it is legitimate or handled differently (though it shouldn't be)
        add_finding(rel_path, 'UI normalization gap', 'Raw <button> tags used instead of canonical <Button>', 'Medium', 'Import and use canonical <Button> component')

    # 4. Raw stat cards instead of <MetricCard>
    if 'text-2xl' in content and ('MetricCard' not in content) and ('stats' in content.lower() or 'tabular-nums' in content):
        add_finding(rel_path, 'UI normalization gap', 'Inline stat cards duplicate MetricCard', 'High', 'Replace with <MetricCard>')
        
    # 5. Duplicate format logic
    if 'function formatStatus' in content or 'function formatLabel' in content:
        add_finding(rel_path, '3NF/SSOT violation', 'Duplicate formatting utility instead of shared core function', 'High', 'Use formatLabel from @/lib/utils')

for module in MODULES:
    mod_path = os.path.join(BASE_DIR, module)
    if not os.path.exists(mod_path):
        continue
    
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
                
                rel_path = os.path.relpath(filepath, BASE_DIR)
                content = open(filepath).read()
                
                # 6. Missing RoleGates
                if file == 'page.tsx' and 'error' not in filepath and 'loading' not in filepath:
                    if not has_layout_gate and 'RoleGate' not in content:
                        add_finding(rel_path, 'Missing workflow (Access Control)', 'Module lacks RBAC. Unauthorized users can access features.', 'Critical', f'Wrap with <RoleGate> in {rel_path} or layout')

                # 7. Duplicate HubTabs boilerplate
                if 'HubTabs' in file and 'import HubTabs' not in content and 'TabsList' in content:
                     add_finding(rel_path, 'UI normalization gap', 'Duplicate HubTabs boilerplate', 'Medium', 'Refactor to use generic HubTabs from components/shared')

if findings:
    print(f'❌ STRESS AUDIT FAILED: {len(findings)} findings detected.')
    print(json.dumps(findings, indent=2))
    sys.exit(1)
else:
    print('✅ STRESS AUDIT PASSED: 0 findings.')
    sys.exit(0)
