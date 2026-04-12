import json
import os
import re

with open('stress_audit.py') as f:
    pass # we already ran it, let's just run it inside this wrapper to get the JSON dict
    
import subprocess
try:
    res = subprocess.run(["python3", "stress_audit.py"], capture_output=True, text=True)
    out = res.stdout
    # json starts at [
    idx = out.find('[')
    if idx != -1:
        data = json.loads(out[idx:])
        
        pages_missing_gate = [item['Location'] for item in data if item['Gap type'] == 'Missing workflow (Access Control)']
        raw_buttons = [item['Location'] for item in data if 'Raw <button>' in item['What breaks']]
        raw_inputs = [item['Location'] for item in data if 'Raw <input>' in item['What breaks']]
        data_leaks = [item['Location'] for item in data if item['Gap type'] == '3NF/SSOT violation (Security Data Leak)']
        
        print(f"RoleGate Gaps: {len(pages_missing_gate)}")
        print(f"Raw Buttons: {len(raw_buttons)}")
        print(f"Raw Inputs: {len(raw_inputs)}")
        print(f"Data Leaks: {len(data_leaks)}")
        print("Data Leaks at:", data_leaks)
        
        with open('plan.json', 'w') as fh:
            json.dump({
                "rolegate": pages_missing_gate,
                "buttons": raw_buttons,
                "inputs": raw_inputs,
                "leaks": data_leaks
            }, fh)
except Exception as e:
    print(e)
