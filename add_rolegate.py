import re
import os

def determine_resource(path):
    parts = path.split('/')
    if 'settings' in parts:
        if 'profile' in parts or 'appearance' in parts or 'data-privacy' in parts:
            return None # no resource guard for personal settings
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
    if 'favorites' in parts: return None
    # Add more as needed based on the path
    
    # Try to derive from the app/app folder name
    idx = parts.index('app')
    if len(parts) > idx + 2:
        return parts[idx + 1].replace('-', '_') # e.g. my-schedule -> my_schedule
    
    return None

import subprocess

cmd = 'find src/app/app -name "page.tsx" | xargs grep -L "RoleGate\|TierGate" | grep -v "node_modules"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
files = [f for f in result.stdout.split('\n') if f.strip()]

for path in files:
    resource = determine_resource(path)
    
    with open(path, 'r') as f:
        content = f.read()
        
    if '<RoleGate' in content: 
        continue
        
    # We want to inject import and wrap the default export.
    # This is tricky with regex. Let's look for `export default function` or `export default async function`
    
    import_statement = "import { RoleGate } from '@/components/shared/RoleGate';\n"
    if 'RoleGate' not in content:
        # insert after last import
        imports_end = [m.end() for m in re.finditer(r"^import\s+.*?;?\s*$", content, re.MULTILINE)]
        idx = imports_end[-1] if imports_end else 0
        while idx < len(content) and content[idx] == '\n':
            idx += 1
        content = content[:idx] + import_statement + content[idx:]

    gate_str = f'<RoleGate resource="{resource}">' if resource else '<RoleGate>'
    
    # Simple regex to find return ( ... ); at the end.
    # This might break complex files, but let's try a very specific approach:
    # regex for `return (` followed by anything, matching balanced parens? hard in python.
    # Alternative: replace `return (` with `return (\n    {gate_str}` and the final `);` with `</RoleGate>\n  );`
    # Warning: lots of ways this can fail if there are multiple returns.
    
    # Let's count returns
    if content.count('return (') == 1:
        content = content.replace('return (', f'return (\n    {gate_str}')
        # the last ); in the file is likely the end
        rindex = content.rfind(');')
        if rindex != -1:
            content = content[:rindex] + '</RoleGate>\n  ' + content[rindex:]
            with open(path, 'w') as f:
                f.write(content)
            print(f"Wrapped {path} with {gate_str}")
        else:
            print(f"Could not find closing ); in {path}")
    else:
        print(f"Skipped {path}: multiple/zero 'return ('")
