import re
import os
import subprocess

def determine_resource(path):
    parts = path.split('/')
    if 'settings' in parts:
        if 'profile' in parts or 'appearance' in parts or 'data-privacy' in parts: return None
        return 'settings'
    if 'clients' in parts: return 'clients'
    if 'tasks' in parts: return 'tasks'
    if 'projects' in parts: return 'projects'
    if 'proposals' in parts: return 'proposals'
    if 'invoices' in parts: return 'invoices'
    if 'crew' in parts: return 'crew'
    if 'budgets' in parts: return 'budgets'
    if 'files' in parts: return 'files'
    if 'finance' in parts: return 'finance'
    if 'equipment' in parts: return 'equipment'
    if 'events' in parts: return 'events'
    if 'logistics' in parts: return 'warehouse'
    if 'favorites' in parts: return None
    
    idx = parts.index('app')
    if len(parts) > idx + 1:
        # e.g. my-schedule -> my_schedule
        # Wait, if idx is app (the folder), the app folder is at parts[idx]. So parts[idx+1]
        x = parts[idx + 1]
        if x == 'app': x = parts[idx + 2] # if app/app
        return x.replace('-', '_')
    
    return None

cmd = 'find src/app/app -name "page.tsx" | xargs grep -L "RoleGate\|TierGate" | grep -v "node_modules"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
files = [f for f in result.stdout.split('\n') if f.strip()]

for path in files:
    resource = determine_resource(path)
    
    with open(path, 'r') as f:
        content = f.read()
        
    gate_str = f'<RoleGate resource="{resource}">' if resource else '<RoleGate>'
    
    if '<RoleGate' in content: 
        continue
        
    import_statement = "import { RoleGate } from '@/components/shared/RoleGate';\n"
    if 'RoleGate' not in content:
        imports_end = [m.end() for m in re.finditer(r"^import\s+.*?;?\s*$", content, re.MULTILINE)]
        idx = imports_end[-1] if imports_end else 0
        while idx < len(content) and content[idx] == '\n': idx += 1
        content = content[:idx] + import_statement + content[idx:]

    # A better heuristic: find the first `return (` after `export default `
    # or just replace the last `);` with `</RoleGate>\n  );`
    # and replace the `return (` that matches `export default`
    
    match = re.search(r"export default(?: async)? function[^)]*\)?[^{]*{", content)
    if match:
        start_idx = match.end()
        # Find first return ( after start_idx
        ret_match = re.search(r"\n\s*return\s*\(", content[start_idx:])
        if ret_match:
            ret_idx = start_idx + ret_match.end()
            content = content[:ret_idx] + f"\n    {gate_str}" + content[ret_idx:]
            
            # Find the last );
            rindex = content.rfind(');')
            if rindex != -1:
                content = content[:rindex] + f'\n    </RoleGate>' + content[rindex:]
                with open(path, 'w') as f:
                    f.write(content)
                print(f"Wrapped {path}")
