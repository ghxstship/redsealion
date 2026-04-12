import os
import re
import json

BASE_DIR = "src/app/app"

with open("plan.json") as f:
    plan = json.load(f)

# 1. Fix RoleGate Gaps
modules = set()
for path in plan['rolegate']:
    parts = path.split('/')
    if len(parts) > 1:
        modules.add(parts[0])

for mod in modules:
    mod_path = os.path.join(BASE_DIR, mod)
    if not os.path.isdir(mod_path): continue
    
    layouts = [
        os.path.join(mod_path, 'layout.tsx'),
        os.path.join(mod_path, '(hub)', 'layout.tsx')
    ]
    
    found = False
    for l in layouts:
        if os.path.exists(l):
            content = open(l).read()
            if 'RoleGate' not in content:
                if "{ children }" in content or "{children}" in content or "{ children: React.ReactNode }" in content:
                    content = "import { RoleGate } from '@/components/shared/RoleGate';\n" + content
                    content = content.replace('{children}', '<RoleGate>{children}</RoleGate>')
                    content = content.replace('{ children }', '<RoleGate>{children}</RoleGate>')
                    with open(l, 'w') as fh: fh.write(content)
            found = True
            break
    
    if not found:
        layout_path = os.path.join(mod_path, 'layout.tsx')
        with open(layout_path, 'w') as fh:
            fh.write("""import { RoleGate } from '@/components/shared/RoleGate';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGate>{children}</RoleGate>;
}
""")

# Fix root if 'page.tsx' is in rolegate directly
if 'page.tsx' in plan['rolegate']:
    root_layout = os.path.join(BASE_DIR, 'layout.tsx')
    if os.path.exists(root_layout):
        content = open(root_layout).read()
        if 'RoleGate' not in content:
             content = "import { RoleGate } from '@/components/shared/RoleGate';\n" + content
             content = content.replace('{children}', '<RoleGate>{children}</RoleGate>')
             content = content.replace('{ children }', '<RoleGate>{children}</RoleGate>')
             with open(root_layout, 'w') as fh: fh.write(content)

# 2. Fix Raw Buttons
for file in plan['buttons']:
    filepath = os.path.join(BASE_DIR, file)
    if not os.path.exists(filepath): continue
    with open(filepath) as f: content = f.read()
    
    if 'import Button' not in content and 'import { Button }' not in content:
        content = "import Button from '@/components/ui/Button';\n" + content
    
    content = re.sub(r'<button\b', '<Button', content)
    content = re.sub(r'</button>', '</Button>', content)
    with open(filepath, 'w') as f: f.write(content)

# 3. Fix Raw Inputs
for file in plan['inputs']:
    filepath = os.path.join(BASE_DIR, file)
    if not os.path.exists(filepath): continue
    with open(filepath) as f: content = f.read()
    
    parts = content.split('<input')
    new_content = parts[0]
    for p in parts[1:]:
        tag_end = p.find('>')
        tag_content = p[:tag_end]
        if 'type="checkbox"' in tag_content or 'type="radio"' in tag_content or 'type="hidden"' in tag_content or 'type="file"' in tag_content:
            new_content += '<input' + p
        else:
            new_content += '<FormInput' + p
            
    if '<FormInput' in new_content and ('import FormInput' not in new_content and 'import { FormInput }' not in new_content):
        new_content = "import FormInput from '@/components/ui/FormInput';\n" + new_content
        
    with open(filepath, 'w') as f: f.write(new_content)

print("Automated refactoring script completed successfully.")
