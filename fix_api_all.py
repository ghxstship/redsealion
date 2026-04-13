import re
import os

with open("missing_api_routes.txt", "r") as f:
    files = [ln.strip() for ln in f if ln.strip()]

for path in files:
    try:
        with open(path, "r") as f:
            content = f.read()

        org_var = None
        if "perm" in content and "checkPermission" in content:
            org_var = "perm!.organizationId"
        elif "ctx" in content and "requireAuth" in content:
            org_var = "ctx.organizationId"
            
        if org_var and "organization_id" not in content and ".from(" in content:
            old_content = content
            
            # Simple regex: find .select(*), .update(*), .delete(*) lines that follow .from() implicitly
            content = re.sub(
                r"(\.(?:select|update|delete|insert)\([^)]*\))", 
                rf"\n    .eq('organization_id', {org_var})\1", 
                content
            )
            # but wait, insert doesn't take eq nicely. Let's exclude insert!
            content = old_content
            content = re.sub(
                r"(\.(?:select|update|delete)\([^)]*\))", 
                rf".eq('organization_id', {org_var})\n    \1", 
                content
            )
            
            if content != old_content:
                with open(path, "w") as f:
                    f.write(content)
                print(f"Fixed {path}")
    except Exception as e:
        print(e)
