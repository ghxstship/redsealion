import { createClient } from '@supabase/supabase-js';

const supabase = createClient('process.env.SUPABASE_URL', 'process.env.SUPABASE_SERVICE_ROLE_KEY');

// Minimal seed script for technical interchange
async function seed() {
  console.log('Seeding Technical Interchange...');
  // Note: Implementation depends on catalog subset IDs
}

seed().catch(console.error);
