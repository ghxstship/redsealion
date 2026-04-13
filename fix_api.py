import os
import re

files_list = "missing_api_routes.txt"

with open(files_list, 'r') as f:
    files = [line.strip() for line in f if line.strip()]

def fix_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Heuristic 1: If there's '.from(' and 'perm.organizationId' is available.
    if 'checkPermission(' in content and '.from(' in content and 'organization_id' not in content:
        # Check if the perm object is used
        if 'if (!perm.allowed)' in content:
            # We can safely add `.eq('organization_id', perm.organizationId)` after `.select(`, `.update(`, `.delete()`
            # We must be careful not to break inserts, but inserts use `.insert(`. We usually don't filter inserts by eq, but rather set the value.
            # But wait, insert often doesn't have an eq.
            pass

    # Actually, a much safer approach is regex replacement for each specific known table!
    # Let's list the tables we are dealing with based on the routes:
    # client_contacts, save_filters, tasks/templates, crew_bookings, crew_ratings, resources_allocations
    
    # Or, I can do it file by file if there are 35. This would be too slow.
    # Let's write a generic AST based or regex based.
    
    replacements_made = 0
    new_content = content
    
    # Replace `.select('*')\n    .eq(` with `.select('*')\n    .eq('organization_id', perm.organizationId)\n    .eq(`
    # wait, sometimes select is single line `.select()`.
    
    patterns = [
        (r"(\.from\('[^']+'\)\s*\n\s*\.(?:select|update|delete)\([^)]*\))", r"\1\n    .eq('organization_id', perm!.organizationId)"),
    ]
    
    for pat, repl in patterns:
        if 'perm' in content and 'checkPermission' in content:
            new_content, count = re.subn(pat, repl, new_content)
            replacements_made += count

    if replacements_made > 0:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file_path} ({replacements_made} replacements)")
    else:
        print(f"Could not automatically fix {file_path}")

for f in files:
    try:
        fix_file(f)
    except Exception as e:
        print(f"Error on {f}: {e}")
