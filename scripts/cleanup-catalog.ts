import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

try {
  const envFile = readFileSync('.env.local', 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* */ }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function cleanup() {
  const { data } = await sb.from('advance_category_groups').select('id, name');
  console.log('Existing groups:', data?.length, data?.map(g => g.name));
  if (data && data.length > 0) {
    const { error: dErr } = await sb.from('advance_category_groups').delete().in('id', data.map(g => g.id));
    console.log('Deleted groups:', dErr ? dErr : 'OK');
  }
  // Also clean up modifier lists
  const { data: mods } = await sb.from('advance_modifier_lists').select('id');
  if (mods && mods.length > 0) {
    const { error: mErr } = await sb.from('advance_modifier_lists').delete().in('id', mods.map(m => m.id));
    console.log('Deleted modifier lists:', mErr ? mErr : 'OK, count=' + mods.length);
  }
  console.log('Cleanup done');
}

cleanup().catch(console.error);
