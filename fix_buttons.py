import re
import os
import subprocess

files = [
    "src/app/app/settings/tags/page.tsx",
    "src/components/admin/tasks/TaskDependencies.tsx",
    "src/components/admin/tasks/TaskTemplateLibrary.tsx",
    "src/components/admin/tasks/ProjectStatusUpdates.tsx",
    "src/components/admin/tasks/TaskPhotoCapture.tsx",
    "src/components/admin/tasks/TaskAttachments.tsx",
    "src/components/admin/tasks/GuestCollaborators.tsx",
    "src/components/admin/my-inbox/MyInboxTable.tsx",
    "src/components/admin/security/PermissionMatrix.tsx",
    "src/components/admin/expenses/MileageForm.tsx",
    "src/components/admin/work-orders/BiddingPanel.tsx",
    "src/components/portal/PortalSidebar.tsx",
    "src/components/portal/journey/JourneyTimeline.tsx",
    "src/components/ServiceWorkerRegistration.tsx",
    "src/components/admin/clients/ClientFormModal.tsx"
]

for path in files:
    if not os.path.exists(path):
        continue
    
    with open(path, 'r') as f:
        content = f.read()

    new_content = content
    # replace `<button ` with `<Button variant="ghost" ` (handling optional spaces)
    # Be careful not to replace already capitalized <Button
    new_content = re.sub(r'<button\b', r'<Button variant="ghost"', new_content)
    new_content = re.sub(r'</button>', r'</Button>', new_content)
    
    if new_content != content:
        # Add import if missing
        if "import Button" not in new_content:
            new_content = "import Button from '@/components/ui/Button';\n" + new_content
            
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Fixed buttons in {path}")
