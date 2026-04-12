import os
import re
import sys
import json

BASE_DIR = 'src/app/app'
E2E_DIR = 'e2e/tests'
findings = []

def add_finding(loc, gap_type, impact, severity, fix):
    findings.append({
        'Location': loc,
        'Gap type': gap_type,
        'What breaks': impact,
        'Severity': severity,
        'Fix': fix
    })

# Part 1: Check E2E directory for TODOs
for root, dirs, files in os.walk(E2E_DIR):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            content = open(filepath).read()
            if 'TODO: expectAccessDenied' in content:
                add_finding(filepath, 'Missing workflow (Testing)', 'Missing server-side role gating verification', 'Critical', 'Replace TODO with RoleGate assertion')

# Part 2: Check App modules systematically
for root, dirs, files in os.walk(BASE_DIR):
    # Determine current module root if we are exactly 1 directory deep into src/app/app
    mod_path = root
    parts = root.split(os.sep)
    idx = parts.index('app') if 'app' in parts else -1
    if idx != -1 and len(parts) > idx + 1:
        # e.g. parts = ['src', 'app', 'app', 'sales', ...] -> mod_path = 'src/app/app/sales'
        mod_root = os.sep.join(parts[:idx + 2])
        
        has_layout_gate = False
        for layout_file in ['layout.tsx', '(hub)/layout.tsx', '(hub)/settings/layout.tsx']:
            lpath = os.path.join(mod_root, layout_file)
            if os.path.exists(lpath) and 'RoleGate' in open(lpath).read():
                has_layout_gate = True

        for file in files:
            filepath = os.path.join(root, file)
            if not (file.endswith('.tsx') or file.endswith('.ts')):
                continue
            content = open(filepath).read()
            rel_path = os.path.relpath(filepath, BASE_DIR)

            # 1. Missing RoleGate
            if file == 'page.tsx' and 'error' not in filepath and 'loading' not in filepath:
                # If there's no layout gate, and no RoleGate in the page, it's a gap
                # Ignore public forms or specifically configured offline/error roots
                if 'portal/' not in filepath and 'forms/' not in filepath:
                    if not has_layout_gate and 'RoleGate' not in content:
                        add_finding(rel_path, 'Missing workflow (Access Control)', 'Module lacks RBAC. Unauthorized users can access features.', 'Critical', f'Wrap with <RoleGate> in {rel_path} or layout')
            
            # 2. Raw inputs
            if '<input' in content:
                raw_inputs = re.findall(r'<input[^>]*>', content)
                for inp in raw_inputs:
                    if 'type="checkbox"' not in inp and 'type="radio"' not in inp and 'type="file"' not in inp and 'type="hidden"' not in inp:
                        add_finding(rel_path, 'UI normalization gap', 'Raw <input> tags used instead of canonical <FormInput>', 'High', 'Migrate to <FormInput>')
                        break
            
            # 3. Raw buttons
            if '<button' in content:
                add_finding(rel_path, 'UI normalization gap', 'Raw <button> tags used instead of canonical <Button>', 'Medium', 'Migrate to <Button>')
                
            # 4. Inline CSS badges / stat cards
            if 'className=' in content and 'bg-' in content and 'rounded-full' in content and 'text-xs' in content and '<StatusBadge' not in content:
                matches = re.findall(r'bg-(?:green|red|blue|amber|yellow|purple|rose|zinc)-\d+.*rounded-full', content)
                if matches:
                    add_finding(rel_path, 'UI normalization gap', 'Inline status badges duplicate <StatusBadge>', 'High', 'Replace inline string badges with canonical <StatusBadge>')
                    
            if 'text-2xl' in content and 'tabular-nums' in content and '<MetricCard' not in content:
                add_finding(rel_path, 'UI normalization gap', 'Inline stat cards duplicate <MetricCard>', 'High', 'Replace with <MetricCard>')
                
            # 5. Security Data Leak
            if '[id]/page.tsx' in filepath and '.select(' in content and '.from(' in content:
                if '.eq(\'organization_id\'' not in content and 'ctx.organizationId' not in content and 'getServiceSupabase' not in content:
                    add_finding(rel_path, '3NF/SSOT violation (Security Data Leak)', 'Cross-tenant data exposure', 'Critical', 'Add explicit organization_id matching filter')

if findings:
    print(f'❌ STRESS AUDIT FAILED: {len(findings)} findings detected.')
    print(json.dumps(findings, indent=2))
    sys.exit(1)
else:
    print('✅ STRESS AUDIT PASSED: 0 findings.')
    sys.exit(0)
