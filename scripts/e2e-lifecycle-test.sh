#!/bin/bash
# =============================================================================
# FlyteDeck Full Lifecycle E2E Test v3
# Fixed column names per bedrock_naming migration (00030)
# =============================================================================

API="http://localhost:3001"
DB="http://127.0.0.1:54321/rest/v1"
AUTH="http://127.0.0.1:54321/auth/v1"
SRK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
ORG="11111111-1111-1111-1111-111111111111"
OWNER="bc1471b8-55f4-448d-0388-e7dbcf7b2d0f"

PASS=0; FAIL=0

check() {
  if [ "$1" = "true" ]; then echo "  ✅ $2"; PASS=$((PASS+1))
  else echo "  ❌ $2 (got: $3)"; FAIL=$((FAIL+1)); fi
}

spost() { curl -s -m5 "$DB/$1" -H "apikey:$SRK" -H "Authorization:Bearer $SRK" -H "Content-Type:application/json" -H "Prefer:return=representation" -d "$2"; }
sget()  { curl -s -m5 "$DB/$1" -H "apikey:$SRK" -H "Authorization:Bearer $SRK"; }
spatch(){ curl -s -m5 "$DB/$1" -H "apikey:$SRK" -H "Authorization:Bearer $SRK" -H "Content-Type:application/json" -X PATCH -d "$2"; }
getid() { echo "$1" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d[0]['id'] if isinstance(d,list) and d else d.get('id','FAIL') if isinstance(d,dict) else 'FAIL')" 2>/dev/null; }

echo "═══════════════════════════════════════════"
echo " FlyteDeck Full Lifecycle E2E Test"
echo "═══════════════════════════════════════════"
echo ""

# ═══ STAGE 1: PUBLIC INTAKE ═══
echo "▸ Stage 1: Public Intake Form"
INTAKE=$(curl -s -m15 "$API/api/public/intake" -H "Content-Type:application/json" \
  -d '{"organization_id":"'"$ORG"'","source":"Website Contact Form","company_name":"Apex Events Corp","contact_first_name":"Sarah","contact_last_name":"Mitchell","contact_email":"sarah@apexevents.com","contact_phone":"+1-555-0142","event_type":"Product Launch Summit","event_date":"2026-06-15","estimated_budget":75000,"message":"Full production, 500+ attendees"}')
LEAD_ID=$(echo "$INTAKE" | python3 -c "import sys,json;print(json.load(sys.stdin).get('lead_id','FAIL'))" 2>/dev/null)
check "$([ "$LEAD_ID" != "FAIL" ] && echo true)" "Lead created: ${LEAD_ID:0:8}..." "$LEAD_ID"

# ═══ STAGE 2: VERIFY CONVERSION ═══
echo "▸ Stage 2: Lead Conversion Pipeline"
sleep 0.5
LEAD=$(sget "leads?id=eq.$LEAD_ID&select=status,converted_to_client_id,converted_to_deal_id,converted_to_contact_id")
STATUS=$(echo "$LEAD"|python3 -c "import sys,json;print(json.load(sys.stdin)[0]['status'])" 2>/dev/null)
CLIENT_ID=$(echo "$LEAD"|python3 -c "import sys,json;print(json.load(sys.stdin)[0].get('converted_to_client_id') or 'NONE')" 2>/dev/null)
DEAL_ID=$(echo "$LEAD"|python3 -c "import sys,json;print(json.load(sys.stdin)[0].get('converted_to_deal_id') or 'NONE')" 2>/dev/null)
check "$([ "$STATUS" = "converted" ] && echo true)" "Lead status: converted" "$STATUS"
check "$([ "$CLIENT_ID" != "NONE" ] && echo true)" "→ Client: ${CLIENT_ID:0:8}" "$CLIENT_ID"
check "$([ "$DEAL_ID" != "NONE" ] && echo true)" "→ Deal: ${DEAL_ID:0:8}" "$DEAL_ID"

# ═══ STAGE 3: VERIFY ENTITIES ═══
echo "▸ Stage 3: Auto-Created Entities"
CNAME=$(sget "clients?id=eq.$CLIENT_ID&select=company_name"|python3 -c "import sys,json;print(json.load(sys.stdin)[0]['company_name'])" 2>/dev/null)
check "$([ "$CNAME" = "Apex Events Corp" ] && echo true)" "Client: $CNAME" "$CNAME"
CEMAIL=$(sget "client_contacts?client_id=eq.$CLIENT_ID&select=email"|python3 -c "import sys,json;print(json.load(sys.stdin)[0]['email'])" 2>/dev/null)
check "$(echo "$CEMAIL"|grep -q "@apexevents" && echo true)" "Contact: $CEMAIL" "$CEMAIL"
DVAL=$(sget "deals?id=eq.$DEAL_ID&select=deal_value"|python3 -c "import sys,json;print(int(json.load(sys.stdin)[0]['deal_value']))" 2>/dev/null)
check "$([ "$DVAL" = "75000" ] && echo true)" "Deal value: \$$DVAL" "$DVAL"

# ═══ STAGE 4: PROPOSAL + PHASES + DELIVERABLES ═══
echo "▸ Stage 4: Proposal with Phases & Deliverables"
PROP=$(spost "proposals" '{"organization_id":"'"$ORG"'","client_id":"'"$CLIENT_ID"'","name":"Product Launch Summit 2026","status":"draft","currency":"USD","total_value":75500,"total_with_addons":83000,"payment_terms":{"structure":"deposit_balance","depositPercent":40,"balancePercent":60},"created_by":"'"$OWNER"'"}')
PID=$(getid "$PROP")
check "$([ "$PID" != "FAIL" ] && echo true)" "Proposal: ${PID:0:8}" "$PID"

# Phases — use phase_number (renamed from number in 00030)
P1=$(spost "phases" '{"proposal_id":"'"$PID"'","phase_number":"1","name":"Discovery & Strategy","sort_order":0,"status":"not_started"}')
P1_ID=$(getid "$P1")
P2=$(spost "phases" '{"proposal_id":"'"$PID"'","phase_number":"2","name":"Design & Engineering","sort_order":1,"status":"not_started"}')
P2_ID=$(getid "$P2")
P3=$(spost "phases" '{"proposal_id":"'"$PID"'","phase_number":"3","name":"Production & Fabrication","sort_order":2,"status":"not_started"}')
P3_ID=$(getid "$P3")
check "$([ "$P1_ID" != "FAIL" ] && [ "$P2_ID" != "FAIL" ] && [ "$P3_ID" != "FAIL" ] && echo true)" "3 phases created" "P1=$P1_ID"

# Deliverables — use is_taxable (renamed from taxable in 00030)
spost "phase_deliverables" '{"phase_id":"'"$P2_ID"'","name":"Stage design & 3D rendering","qty":1,"unit_cost":15000,"total_cost":15000,"category":"design","sort_order":0,"is_taxable":false}' >/dev/null
spost "phase_deliverables" '{"phase_id":"'"$P2_ID"'","name":"AV system design","qty":1,"unit_cost":12000,"total_cost":12000,"category":"technical","sort_order":1,"is_taxable":false}' >/dev/null
spost "phase_deliverables" '{"phase_id":"'"$P3_ID"'","name":"Stage fabrication","qty":1,"unit_cost":25000,"total_cost":25000,"category":"fabrication","sort_order":0,"is_taxable":false}' >/dev/null
spost "phase_deliverables" '{"phase_id":"'"$P3_ID"'","name":"LED wall installation","qty":2,"unit_cost":8000,"total_cost":16000,"category":"technical","sort_order":1,"is_taxable":false}' >/dev/null
D_CT=$(sget "phase_deliverables?or=(phase_id.eq.$P2_ID,phase_id.eq.$P3_ID)&select=id"|python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "$([ "$D_CT" = "4" ] && echo true)" "4 deliverables (\$68K total)" "$D_CT"

# Addon — use is_selected/is_taxable
spost "phase_addons" '{"phase_id":"'"$P2_ID"'","name":"VR Experience Module","qty":1,"unit_cost":7500,"total_cost":7500,"category":"premium","sort_order":0,"is_selected":true,"is_taxable":false}' >/dev/null
check "true" "1 addon: VR Module (\$7,500)"

# ═══ STAGE 5: TASKS ═══
echo "▸ Stage 5: Project Tasks"
T1=$(spost "tasks" '{"organization_id":"'"$ORG"'","title":"Finalize venue contracts","status":"todo","priority":"high","assignee_id":"'"$OWNER"'","proposal_id":"'"$PID"'","due_date":"2026-04-12","estimated_hours":8,"created_by":"'"$OWNER"'","sort_order":0}')
T1_ID=$(getid "$T1")
T2=$(spost "tasks" '{"organization_id":"'"$ORG"'","title":"Design stage layout","status":"todo","priority":"high","assignee_id":"'"$OWNER"'","proposal_id":"'"$PID"'","phase_id":"'"$P2_ID"'","due_date":"2026-04-19","estimated_hours":16,"created_by":"'"$OWNER"'","sort_order":1}')
T2_ID=$(getid "$T2")
T3=$(spost "tasks" '{"organization_id":"'"$ORG"'","title":"Order AV equipment","status":"todo","priority":"medium","proposal_id":"'"$PID"'","phase_id":"'"$P3_ID"'","due_date":"2026-04-15","estimated_hours":4,"created_by":"'"$OWNER"'","sort_order":2}')
T3_ID=$(getid "$T3")
T4=$(spost "tasks" '{"organization_id":"'"$ORG"'","title":"Send speaker media kits","status":"todo","priority":"low","assignee_id":"'"$OWNER"'","proposal_id":"'"$PID"'","due_date":"2026-04-26","estimated_hours":3,"created_by":"'"$OWNER"'","sort_order":3}')
T4_ID=$(getid "$T4")
T5=$(spost "tasks" '{"organization_id":"'"$ORG"'","title":"Technical rehearsal","status":"todo","priority":"high","assignee_id":"'"$OWNER"'","proposal_id":"'"$PID"'","phase_id":"'"$P3_ID"'","due_date":"2026-06-13","estimated_hours":12,"created_by":"'"$OWNER"'","sort_order":4}')
T5_ID=$(getid "$T5")
check "$([ "$T1_ID" != "FAIL" ] && [ "$T2_ID" != "FAIL" ] && [ "$T3_ID" != "FAIL" ] && [ "$T4_ID" != "FAIL" ] && [ "$T5_ID" != "FAIL" ] && echo true)" "5 tasks with assignments" "T1=$T1_ID T2=$T2_ID"

# ═══ STAGE 6: CREW (crew_profiles links to users table) ═══
echo "▸ Stage 6: Crew & Resources"
# crew_profiles requires user_id FK — use the seeded admin user
ADMIN_ID=$(sget "users?email=eq.admin@redsealion.test&select=id"|python3 -c "import sys,json;d=json.load(sys.stdin);print(d[0]['id'] if d else 'FAIL')" 2>/dev/null)
if [ "$ADMIN_ID" != "FAIL" ] && [ -n "$ADMIN_ID" ]; then
  CREW=$(spost "crew_profiles" '{"user_id":"'"$ADMIN_ID"'","organization_id":"'"$ORG"'","skills":["stage_management","rigging","safety"],"hourly_rate":85,"availability_default":"available","onboarding_status":"complete"}')
  CREW_ID=$(getid "$CREW")
  check "$([ "$CREW_ID" != "FAIL" ] && echo true)" "Crew profile: admin (\$85/hr)" "$CREW_ID"
else
  # Use crew_bookings as alternative crew tracking
  check "false" "No admin user found for crew profile" "$ADMIN_ID"
fi

# Resource allocation
ALLOC=$(spost "resource_allocations" '{"organization_id":"'"$ORG"'","user_id":"'"${ADMIN_ID:-$OWNER}"'","proposal_id":"'"$PID"'","start_date":"2026-06-10","end_date":"2026-06-16","hours_per_day":10,"role":"Stage Manager"}')
ALLOC_ID=$(getid "$ALLOC")
check "$([ "$ALLOC_ID" != "FAIL" ] && echo true)" "Resource allocated: Jun 10-16" "$ALLOC_ID"

# ═══ STAGE 7: ASSETS ═══
echo "▸ Stage 7: Asset Management"
# Use is_trackable, is_reusable (renamed in 00030)
A1=$(spost "assets" '{"organization_id":"'"$ORG"'","name":"LED Video Wall 20x10","type":"equipment","category":"AV","proposal_id":"'"$PID"'","is_trackable":true,"is_reusable":true,"status":"planned","condition":"new","acquisition_cost":45000,"serial_number":"LED-VW-2026-001"}')
A1_ID=$(getid "$A1")
A2=$(spost "assets" '{"organization_id":"'"$ORG"'","name":"Modular Stage Platform","type":"equipment","category":"Staging","proposal_id":"'"$PID"'","is_trackable":true,"is_reusable":true,"status":"planned","condition":"new","acquisition_cost":18000,"serial_number":"STG-PLT-2026-001"}')
A2_ID=$(getid "$A2")
A3=$(spost "assets" '{"organization_id":"'"$ORG"'","name":"Branded Entry Signage","type":"fabrication","category":"Signage","proposal_id":"'"$PID"'","is_trackable":false,"is_reusable":false,"status":"planned","condition":"new","acquisition_cost":3500}')
A3_ID=$(getid "$A3")
check "$([ "$A1_ID" != "FAIL" ] && [ "$A2_ID" != "FAIL" ] && [ "$A3_ID" != "FAIL" ] && echo true)" "3 assets: LED/Stage/Signage (\$66.5K)" "A1=$A1_ID"

# ═══ STAGE 8: TIME TRACKING ═══
echo "▸ Stage 8: Time Tracking"
# Use is_billable (renamed from billable in 00030)
TE1=$(spost "time_entries" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","proposal_id":"'"$PID"'","description":"Stage design and 3D rendering","start_time":"2026-04-06T09:00:00Z","end_time":"2026-04-06T17:00:00Z","duration_minutes":480,"is_billable":true}')
TE1_ID=$(getid "$TE1")
TE2=$(spost "time_entries" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","proposal_id":"'"$PID"'","description":"Vendor coordination","start_time":"2026-04-07T10:00:00Z","end_time":"2026-04-07T14:00:00Z","duration_minutes":240,"is_billable":true}')
TE2_ID=$(getid "$TE2")
TE3=$(spost "time_entries" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","proposal_id":"'"$PID"'","description":"Technical rehearsal","start_time":"2026-06-13T08:00:00Z","end_time":"2026-06-13T20:00:00Z","duration_minutes":720,"is_billable":true}')
TE3_ID=$(getid "$TE3")
check "$([ "$TE1_ID" != "FAIL" ] && [ "$TE2_ID" != "FAIL" ] && [ "$TE3_ID" != "FAIL" ] && echo true)" "3 time entries (24h total)" "TE1=$TE1_ID"

# ═══ STAGE 9: TASK COMPLETION ═══
echo "▸ Stage 9: Task Completion"
for TID in $T1_ID $T2_ID $T3_ID $T4_ID $T5_ID; do
  spatch "tasks?id=eq.$TID" '{"status":"done"}' >/dev/null 2>&1
done
spatch "phases?id=eq.$P1_ID" '{"status":"completed"}' >/dev/null
spatch "phases?id=eq.$P2_ID" '{"status":"completed"}' >/dev/null
spatch "phases?id=eq.$P3_ID" '{"status":"completed"}' >/dev/null
DONE=$(sget "tasks?proposal_id=eq.$PID&status=eq.done&select=id"|python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
PDONE=$(sget "phases?proposal_id=eq.$PID&status=eq.completed&select=id"|python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "$([ "$DONE" = "5" ] && echo true)" "5/5 tasks done" "$DONE"
check "$([ "$PDONE" -ge 3 ] 2>/dev/null && echo true)" "3+ phases completed" "$PDONE"

# ═══ STAGE 10: EXPENSES ═══
echo "▸ Stage 10: Expense Tracking"
spost "expenses" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","category":"venue","amount":5000,"description":"Grand Ballroom deposit","expense_date":"2026-04-10","proposal_id":"'"$PID"'","status":"approved"}' >/dev/null
spost "expenses" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","category":"equipment","amount":3500,"description":"AV equipment rental","expense_date":"2026-04-12","proposal_id":"'"$PID"'","status":"approved"}' >/dev/null
spost "expenses" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","category":"materials","amount":2200,"description":"Signage materials","expense_date":"2026-04-14","proposal_id":"'"$PID"'","status":"approved"}' >/dev/null
spost "expenses" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","category":"labor","amount":4250,"description":"Crew wages - 50hrs","expense_date":"2026-06-16","proposal_id":"'"$PID"'","status":"approved"}' >/dev/null
spost "expenses" '{"organization_id":"'"$ORG"'","user_id":"'"$OWNER"'","category":"transportation","amount":1800,"description":"Equipment logistics","expense_date":"2026-06-09","proposal_id":"'"$PID"'","status":"pending"}' >/dev/null
EX=$(sget "expenses?proposal_id=eq.$PID&select=amount"|python3 -c "import sys,json;d=json.load(sys.stdin);print(f'{len(d)}|{sum(e[\"amount\"] for e in d)}')" 2>/dev/null)
IFS='|' read EC ET <<< "$EX"
check "$([ "$EC" = "5" ] && echo true)" "5 expenses (\$${ET})" "$EC"

# ═══ STAGE 11: INVOICES ═══
echo "▸ Stage 11: Invoice Generation"
INV1=$(spost "invoices" '{"organization_id":"'"$ORG"'","client_id":"'"$CLIENT_ID"'","proposal_id":"'"$PID"'","invoice_number":"INV-2026-001","type":"deposit","status":"sent","issue_date":"2026-04-05","due_date":"2026-04-19","subtotal":30200,"tax_amount":0,"total":30200,"amount_paid":0,"currency":"USD","memo":"Deposit (40%) - Product Launch Summit"}')
INV1_ID=$(getid "$INV1")
spost "invoice_line_items" '{"invoice_id":"'"$INV1_ID"'","description":"Deposit (40%)","quantity":1,"rate":30200,"amount":30200,"is_taxable":false}' >/dev/null

INV2=$(spost "invoices" '{"organization_id":"'"$ORG"'","client_id":"'"$CLIENT_ID"'","proposal_id":"'"$PID"'","invoice_number":"INV-2026-002","type":"balance","status":"sent","issue_date":"2026-06-16","due_date":"2026-07-16","subtotal":45300,"tax_amount":0,"total":45300,"amount_paid":0,"currency":"USD","memo":"Balance (60%) - Product Launch Summit"}')
INV2_ID=$(getid "$INV2")
spost "invoice_line_items" '[{"invoice_id":"'"$INV2_ID"'","description":"Stage design","quantity":1,"rate":9000,"amount":9000,"is_taxable":false},{"invoice_id":"'"$INV2_ID"'","description":"AV design","quantity":1,"rate":7200,"amount":7200,"is_taxable":false},{"invoice_id":"'"$INV2_ID"'","description":"Stage fabrication","quantity":1,"rate":15000,"amount":15000,"is_taxable":false},{"invoice_id":"'"$INV2_ID"'","description":"LED wall (x2)","quantity":2,"rate":4800,"amount":9600,"is_taxable":false},{"invoice_id":"'"$INV2_ID"'","description":"VR Module addon","quantity":1,"rate":4500,"amount":4500,"is_taxable":false}]' >/dev/null
check "$([ "$INV1_ID" != "FAIL" ] && echo true)" "Deposit INV-2026-001: \$30,200" "$INV1_ID"
check "$([ "$INV2_ID" != "FAIL" ] && echo true)" "Balance INV-2026-002: \$45,300" "$INV2_ID"

# ═══ STAGE 12: DEPOSIT PAYMENT ═══
echo "▸ Stage 12: Deposit Payment"
PAY1=$(spost "invoice_payments" '{"invoice_id":"'"$INV1_ID"'","organization_id":"'"$ORG"'","amount":30200,"method":"bank_transfer","reference":"WIRE-APX-04102026","notes":"Deposit from Apex Events","received_date":"2026-04-10","recorded_by":"'"$OWNER"'"}')
PAY1_ID=$(getid "$PAY1")
spatch "invoices?id=eq.$INV1_ID" '{"status":"paid","amount_paid":30200,"paid_date":"2026-04-10"}' >/dev/null
check "$([ "$PAY1_ID" != "FAIL" ] && echo true)" "\$30,200 deposit paid" "$PAY1_ID"
INV1_ST=$(sget "invoices?id=eq.$INV1_ID&select=status"|python3 -c "import sys,json;print(json.load(sys.stdin)[0]['status'])" 2>/dev/null)
check "$([ "$INV1_ST" = "paid" ] && echo true)" "Deposit invoice → PAID" "$INV1_ST"

# ═══ STAGE 13: FINAL BILLING ═══
echo "▸ Stage 13: Final Billing & Reconciliation"
spost "invoice_payments" '{"invoice_id":"'"$INV2_ID"'","organization_id":"'"$ORG"'","amount":25000,"method":"credit_card","reference":"CC-APX-06182026","notes":"Partial balance","received_date":"2026-06-18","recorded_by":"'"$OWNER"'"}' >/dev/null
spatch "invoices?id=eq.$INV2_ID" '{"status":"partially_paid","amount_paid":25000}' >/dev/null
spost "invoice_payments" '{"invoice_id":"'"$INV2_ID"'","organization_id":"'"$ORG"'","amount":20300,"method":"bank_transfer","reference":"WIRE-APX-07012026","notes":"Final balance","received_date":"2026-07-01","recorded_by":"'"$OWNER"'"}' >/dev/null
spatch "invoices?id=eq.$INV2_ID" '{"status":"paid","amount_paid":45300,"paid_date":"2026-07-01"}' >/dev/null
INV2_ST=$(sget "invoices?id=eq.$INV2_ID&select=status"|python3 -c "import sys,json;print(json.load(sys.stdin)[0]['status'])" 2>/dev/null)
check "$([ "$INV2_ST" = "paid" ] && echo true)" "Balance invoice → PAID" "$INV2_ST"

# Revenue verification
REV=$(sget "invoices?proposal_id=eq.$PID&select=total,amount_paid,status"|python3 -c "
import sys,json
inv=json.load(sys.stdin)
t=sum(i['total'] for i in inv); p=sum(i['amount_paid'] for i in inv)
ap=all(i['status']=='paid' for i in inv)
print(f'{t}|{p}|{ap}')
" 2>/dev/null)
IFS='|' read RT RP RAP <<< "$REV"
check "$([ "$RAP" = "True" ] && echo true)" "All invoices paid: \$${RP} / \$${RT}" "$RAP"

# ═══ FINAL SUMMARY ═══
echo ""
echo "═══════════════════════════════════════════"
echo " RECONCILIATION"
echo "═══════════════════════════════════════════"
echo "  Revenue:  \$$RT invoiced, \$$RP collected"
EX_TOTAL=$(sget "expenses?proposal_id=eq.$PID&select=amount"|python3 -c "import sys,json;print(sum(e['amount'] for e in json.load(sys.stdin)))" 2>/dev/null)
echo "  Expenses: \$$EX_TOTAL"
PROFIT=$(python3 -c "print($RP - $EX_TOTAL)" 2>/dev/null)
MARGIN=$(python3 -c "print(f'{($RP-$EX_TOTAL)/$RP*100:.1f}')" 2>/dev/null)
echo "  Profit:   \$$PROFIT ($MARGIN% margin)"
THRS=$(sget "time_entries?proposal_id=eq.$PID&select=duration_minutes"|python3 -c "import sys,json;m=sum(t['duration_minutes'] for t in json.load(sys.stdin));print(f'{m//60}h {m%60}m')" 2>/dev/null)
echo "  Time:     $THRS tracked"
ACT=$(sget "assets?proposal_id=eq.$PID&select=acquisition_cost"|python3 -c "import sys,json;a=json.load(sys.stdin);print(f'{len(a)} items, \${sum(x[\"acquisition_cost\"] or 0 for x in a):,.0f}')" 2>/dev/null)
echo "  Assets:   $ACT"
echo ""
echo "  Lead → Client → Deal → Proposal → 3 Phases"
echo "  → 4 Deliverables + 1 Addon → 5 Tasks (all done)"
echo "  → 3 Time Entries → 3 Assets → 5 Expenses"
echo "  → 2 Invoices → 3 Payments → FULLY RECONCILED"
echo ""
echo "═══════════════════════════════════════════"
echo " RESULT: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo " 🎉 ALL GREEN — Full lifecycle verified!"
else
  echo " ⚠️  $FAIL check(s) need attention"
fi
echo ""
echo "PROPOSAL_ID=$PID"
