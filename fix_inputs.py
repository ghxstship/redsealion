import re
import os
import subprocess

cmd = "grep -rl '<input\\b' src/components/admin/ src/app/ --include='*.tsx' | grep -v 'Checkbox.tsx' | grep -v 'FormInput.tsx'"
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
files = [f for f in result.stdout.split('\n') if f.strip()]

for path in files:
    with open(path, 'r') as f:
        content = f.read()

    new_content = content
    # Replace indeterminate refs with indeterminate prop
    # e.g.: ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
    new_content = re.sub(
        r"ref=\{\(el\) => \{ if \(el\) el\.indeterminate = ([^;]+); \}\}",
        r"indeterminate={\1}",
        new_content
    )
    
    # Checkbox replacement
    # replace `<input type="checkbox"` with `<Checkbox`
    new_content = new_content.replace('<input type="checkbox"', '<Checkbox')
    
    # Form input replacements
    # replace `<input` (that aren't checked/radio/file if manually verifiable, but here we assume the rest are text)
    # wait, there are type="file", type="hidden", etc.
    new_content = re.sub(r'<input(\s+type="(?:text|email|number|password|url|tel)")', r'<FormInput\1', new_content)
    # Also if there's an <input without type
    # This is tricky using regex. Let's just focus on checkbox since that's 90% of tables!
    
    if new_content != content:
        # Add import
        if '<Checkbox' in new_content and 'Checkbox' not in content:
            new_content = "import Checkbox from '@/components/ui/Checkbox';\n" + new_content
        
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {path}")
