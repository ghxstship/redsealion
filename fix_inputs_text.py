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
    # replace `<input` with `<FormInput` if it has type text/email/number etc
    new_content = re.sub(
        r'<input([^>]*type="(?:text|email|number|password|url|tel|date)"[^>]*)>', 
        r'<FormInput\1>', 
        new_content
    )
    
    # Also if there's an <input without type
    # This is tricky using regex. Let's look for `<input` that don't have `type="`
    # `<input\s+([^>]*)(?<!type="[^"]")>` -> hard to express in simple regex.
    # Let's just do it manually for the files left
    
    if new_content != content:
        # Add import
        if '<FormInput' in new_content and 'FormInput' not in content:
            new_content = "import { FormInput } from '@/components/ui/FormInput';\n" + new_content
        
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Fixed text inputs in {path}")
