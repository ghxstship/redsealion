import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
APP_DIR = os.path.join(SRC, "app")
API_DIR = os.path.join(APP_DIR, "api")

output_lines = []
flags = {
    "Orphaned Elements": [],
    "Dead-End Workflows": [],
    "Permission Gaps": [],
    "Dangling Dependencies": []
}

def rel(p): return os.path.relpath(p, ROOT)

def parse_file(filepath):
    try:
        with open(filepath, 'r') as f:
            return f.read()
    except:
        return ""

def scan_pages(base_dir, base_title):
    output_lines.append(f"Platform / App Name: Red Sea Lion - {base_title}")
    
    for r, d, f in os.walk(base_dir):
        if 'node_modules' in r or '.next' in r: continue
        for file in f:
            if file in ['page.tsx', 'layout.tsx']:
                full_path = os.path.join(r, file)
                content = parse_file(full_path)
                
                # Identity
                name = os.path.basename(r) if os.path.basename(r) != "app" else "Root"
                if name.startswith('(') and name.endswith(')'): name = name[1:-1]
                level = "Page" if file == 'page.tsx' else "Section (Layout)"
                node_path = rel(r).replace('src/app', '') or '/'
                
                # Capabilities
                capabilities = []
                if 'use client' in content: capabilities.append("Client-side interactivity")
                if 'fetch(' in content or 'supabase' in content: capabilities.append("Data fetching")
                if '<form' in content or 'FormInput' in content: capabilities.append("Form Submission (CRUD)")
                
                # Workflows
                workflows = []
                if '/api/' in content:
                    workflows.append(f"Calls API endpoint: {re.findall(r'/api/[a-zA-Z0-9/-]+', content)}")
                if 'Button' in content and 'href' in content:
                    workflows.append("Navigation trigger")
                    
                # Dependencies
                deps = re.findall(r'from\s+[\'"](.*?)[\'"]', content)
                
                # RBAC
                rbac = []
                if 'RoleGate' in content:
                    roles = re.findall(r'allowedRoles=\{?\[?(.*?)\]?\}?', content)
                    rbac.append(f"Guarded by RoleGate: {roles}")
                if 'requirePermission' in content or 'checkPermission' in content:
                    rbac.append("Requires specific permissions")
                    
                if not rbac and file == 'page.tsx' and 'app/app/' in full_path:
                    # Flag permission gaps if it's an internal app page missing RoleGate and not inheriting?
                    # Inheritance is complex, but we'll flag it for review
                    flags["Permission Gaps"].append(f"Page {node_path} has no explicit RoleGate")
                    
                if file == 'page.tsx' and not workflows and not capabilities:
                    flags["Dead-End Workflows"].append(f"Page {node_path} has no obvious actions or links out")
                    
                output_lines.append(f"└── {level}: {name}")
                output_lines.append(f"    ├── Identity: {{ path: '{node_path}' }}")
                output_lines.append(f"    ├── Capabilities: {capabilities}")
                output_lines.append(f"    ├── Workflows: {workflows}")
                output_lines.append(f"    ├── Dependencies count: {len(deps)}")
                output_lines.append(f"    └── RBAC: {rbac}")

print("Scanning app pages...")
scan_pages(os.path.join(APP_DIR, 'app'), "Internal App")
scan_pages(os.path.join(APP_DIR, 'portal'), "External Portal")

with open(os.path.join(ROOT, 'sitemap_inventory.md'), 'w') as f:
    f.write("# Site Map & Workflow Inventory\n\n")
    f.write("```\n")
    f.write("\n".join(output_lines))
    f.write("\n```\n\n")
    
    f.write("## Quality Flags\n\n")
    for k, v in flags.items():
        f.write(f"### {k}\n")
        if not v:
            f.write("- None detected\n")
        else:
            for item in v[:20]: # Limit for summary
                f.write(f"- {item}\n")
            if len(v) > 20:
                f.write(f"- ...and {len(v)-20} more\n")
        f.write("\n")

print("Generated sitemap_inventory.md")
