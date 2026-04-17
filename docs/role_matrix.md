# RED SEA LION — ROLE INVENTORY MATRIX

| role_id | role_name | role_class | entity_type | rbac_scope | parent_role | classification_codes | compvss_mapping | atlvs_mapping | gvteway_mapping |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `role_prj_exec` | Executive | executive | WHO (person) | project_admin, budget_approve | None | N/A | Visibility/Reporting | Approvals/Budget | N/A |
| `role_prj_prod` | Production | production | WHO (person) | project_manage, task_write | `role_prj_exec` | N/A | Crew Mgmt/Call Sheets | Operations/Tasks | Event Creation |
| `role_prj_mgmt` | Management | management | WHO (person) | logistics_manage, vendor_write | `role_prj_prod` | N/A | Shift Mgmt | Venue/Logistics | N/A |
| `role_prj_crew` | Crew | crew | WHO (person) | shift_read, task_update | `role_prj_mgmt` | NAICS 71, UNSPSC 82 | Timesheets/Shifts | Task assignment | N/A |
| `role_prj_staff` | Staff | staff | WHO (person) | task_read, checkin | `role_prj_mgmt` | NAICS 561 | Shifts/Check-in | N/A | Event operations |
| `role_prj_tal` | Talent | talent | WHO (person) | rider_read, advance_update | `role_prj_prod` | NAICS 711 | Advancing/Hospitality | N/A | VIP Access |
| `role_prj_vend` | Vendor | vendor | WHO (org) | advance_update, invoice_write | `role_prj_prod` | NIGP/UNSPSC mapped | Fulfillment/Deliverables | Assets/Shipments | N/A |
| `role_prj_cli` | Client | client | WHO (org) | project_read, approve_deliverable | None | N/A | Read-only | Approval Portals | N/A |
| `role_prj_spon` | Sponsor | sponsor | WHO (org) | asset_read, activation_read | `role_prj_cli` | NAICS 5418 | N/A | Activations | Brand Visibility |
| `role_prj_prs` | Press | press | WHO (person) | access_granted, asset_read | `role_prj_cli` | NAICS 511 | Credentialing | N/A | Media Portal |
| `role_prj_gst` | Guest | guest | WHO (person) | access_granted, inv_read | `role_prj_tal` | N/A | Ticketing/Check-in | N/A | Concierge/Access |
| `role_prj_att` | Attendee | attendee | WHO (person) | access_granted | None | N/A | Crowd Control | N/A | General Admission |
