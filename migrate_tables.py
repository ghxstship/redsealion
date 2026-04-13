import os
import re
import glob

def run():
    files = glob.glob('src/**/*.tsx', recursive=True)
    count = 0
    
    for file_path in files:
        if file_path.endswith('Table.tsx') and 'components/ui' in file_path:
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if '<table' not in content:
            continue
            
        count += 1
        
        # Replace tags
        content = re.sub(r'<table(\s|>)', r'<Table\1', content)
        content = re.sub(r'</table\s*>', r'</Table>', content)
        
        content = re.sub(r'<thead(\s|>)', r'<TableHeader\1', content)
        content = re.sub(r'</thead\s*>', r'</TableHeader>', content)
        
        content = re.sub(r'<tbody(\s|>)', r'<TableBody\1', content)
        content = re.sub(r'</tbody\s*>', r'</TableBody>', content)
        
        content = re.sub(r'<tr(\s|>)', r'<TableRow\1', content)
        content = re.sub(r'</tr\s*>', r'</TableRow>', content)
        
        content = re.sub(r'<th(\s|>)', r'<TableHead\1', content)
        content = re.sub(r'</th\s*>', r'</TableHead>', content)
        
        content = re.sub(r'<td(\s|>)', r'<TableCell\1', content)
        content = re.sub(r'</td\s*>', r'</TableCell>', content)
        
        # Strip exact matching boilerplate to avoid class collisions
        boilers = [
            'className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider"',
            'className="divide-y divide-border"',
            'className="w-full"',
            'className="w-full text-sm"',
            'className="w-full text-left text-sm"',
            'className="w-full min-w-[500px]"',
        ]
        for b in boilers:
            content = content.replace(b, '')
            
        # Clean up empty className declarations left by the stripper
        content = content.replace(' className=""', '')

        # Add import if missing
        import_statement = "import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';"
        if import_statement not in content:
            imports = list(re.finditer(r'^import .*?from .*?;?$', content, re.MULTILINE))
            if imports:
                last_import = imports[-1]
                idx = last_import.end()
                content = content[:idx] + "\n" + import_statement + content[idx:]
            else:
                content = import_statement + "\n\n" + content
                
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    print(f"Successfully migrated {count} files.")

if __name__ == '__main__':
    run()
