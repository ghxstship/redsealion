/**
 * Production Advancing Catalog Seed Script
 *
 * Populates the advance catalog with 351 items across 7 category groups,
 * complete with variants, modifier lists, and realistic pricing.
 *
 * Usage: npx tsx scripts/seed-advance-catalog.ts
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually (no dotenv dependency)
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
} catch { /* env already loaded */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function uuid() {
  return crypto.randomUUID();
}

// ——— Category Groups (7 matching advance_type enum) ———
const GROUPS = [
  { id: uuid(), name: 'Access & Credentials', slug: 'access', sort_order: 1, icon: 'KeyRound', description: 'Badges, parking, credentials, security' },
  { id: uuid(), name: 'Production', slug: 'production', sort_order: 2, icon: 'Clapperboard', description: 'Stage, scenic, set build, fabrication' },
  { id: uuid(), name: 'Technical', slug: 'technical', sort_order: 3, icon: 'Wrench', description: 'Audio, video, lighting, power distribution' },
  { id: uuid(), name: 'Hospitality', slug: 'hospitality', sort_order: 4, icon: 'UtensilsCrossed', description: 'Catering, facilities, site services' },
  { id: uuid(), name: 'Travel & Transport', slug: 'travel', sort_order: 5, icon: 'Truck', description: 'Vehicles, freight, hotels, ground transport' },
  { id: uuid(), name: 'Labor & Crew', slug: 'labor', sort_order: 6, icon: 'HardHat', description: 'Stagehands, technicians, runners, specialists' },
  { id: uuid(), name: 'Custom', slug: 'custom', sort_order: 7, icon: 'Boxes', description: 'Miscellaneous and custom items' },
] as const;

const groupMap: Record<string, string> = {};
GROUPS.forEach((g) => (groupMap[g.slug] = g.id));

// ——— Categories & Subcategories ———
interface CatDef {
  group: string;
  name: string;
  slug: string;
  subs: { name: string; slug: string }[];
}

const CATEGORIES: CatDef[] = [
  // Access
  { group: 'access', name: 'Badges & Passes', slug: 'badges', subs: [
    { name: 'All-Access', slug: 'all-access' }, { name: 'Backstage', slug: 'backstage' },
    { name: 'VIP', slug: 'vip' }, { name: 'Crew', slug: 'crew-badge' },
    { name: 'Parking', slug: 'parking' },
  ]},
  { group: 'access', name: 'Credentials', slug: 'credentials', subs: [
    { name: 'Photo ID', slug: 'photo-id' }, { name: 'RFID Wristband', slug: 'rfid' },
    { name: 'Vehicle Placard', slug: 'vehicle' },
  ]},
  // Production
  { group: 'production', name: 'Staging', slug: 'staging', subs: [
    { name: 'Deck & Risers', slug: 'deck' }, { name: 'Truss', slug: 'truss' },
    { name: 'Drape', slug: 'drape' }, { name: 'Scenic Flats', slug: 'scenic' },
  ]},
  { group: 'production', name: 'Scenic & Set', slug: 'scenic-set', subs: [
    { name: 'Backdrops', slug: 'backdrops' }, { name: 'Props', slug: 'props' },
    { name: 'Signage', slug: 'signage' }, { name: 'Furniture', slug: 'furniture' },
  ]},
  { group: 'production', name: 'Tenting & Structures', slug: 'tenting', subs: [
    { name: 'Frame Tents', slug: 'frame-tent' }, { name: 'Pole Tents', slug: 'pole-tent' },
    { name: 'Clear Span', slug: 'clear-span' }, { name: 'Pop-Ups', slug: 'popup' },
  ]},
  // Technical
  { group: 'technical', name: 'Audio', slug: 'audio', subs: [
    { name: 'PA Systems', slug: 'pa' }, { name: 'Monitors', slug: 'monitors' },
    { name: 'Microphones', slug: 'microphones' }, { name: 'Playback', slug: 'playback' },
  ]},
  { group: 'technical', name: 'Video', slug: 'video', subs: [
    { name: 'LED Walls', slug: 'led-walls' }, { name: 'Projection', slug: 'projection' },
    { name: 'Cameras', slug: 'cameras' }, { name: 'Switching', slug: 'switching' },
  ]},
  { group: 'technical', name: 'Lighting', slug: 'lighting', subs: [
    { name: 'Moving Heads', slug: 'movers' }, { name: 'Wash Fixtures', slug: 'wash' },
    { name: 'Spots', slug: 'spots' }, { name: 'Atmospherics', slug: 'atmospherics' },
  ]},
  { group: 'technical', name: 'Power Distribution', slug: 'power', subs: [
    { name: 'Generators', slug: 'generators' }, { name: 'Distro', slug: 'distro' },
    { name: 'Cable & Connectors', slug: 'cable' },
  ]},
  // Hospitality
  { group: 'hospitality', name: 'Catering', slug: 'catering', subs: [
    { name: 'Meal Service', slug: 'meals' }, { name: 'Snacks & Beverages', slug: 'snacks' },
    { name: 'Late Night', slug: 'late-night' },
  ]},
  { group: 'hospitality', name: 'Facilities', slug: 'facilities', subs: [
    { name: 'Restrooms', slug: 'restrooms' }, { name: 'HVAC', slug: 'hvac' },
    { name: 'Waste Management', slug: 'waste' },
  ]},
  { group: 'hospitality', name: 'Site Services', slug: 'site-services', subs: [
    { name: 'Security', slug: 'security' }, { name: 'Medical', slug: 'medical' },
    { name: 'Cleaning', slug: 'cleaning' },
  ]},
  // Travel
  { group: 'travel', name: 'Ground Transport', slug: 'ground', subs: [
    { name: 'Passenger Vans', slug: 'vans' }, { name: 'Box Trucks', slug: 'box-trucks' },
    { name: 'Flatbeds', slug: 'flatbeds' }, { name: 'Sedans', slug: 'sedans' },
  ]},
  { group: 'travel', name: 'Freight & Shipping', slug: 'freight', subs: [
    { name: 'LTL', slug: 'ltl' }, { name: 'FTL', slug: 'ftl' },
    { name: 'Air Freight', slug: 'air' },
  ]},
  { group: 'travel', name: 'Accommodations', slug: 'accommodations', subs: [
    { name: 'Hotel Rooms', slug: 'hotel' }, { name: 'Per Diem', slug: 'per-diem' },
  ]},
  // Labor
  { group: 'labor', name: 'Stagehands', slug: 'stagehands', subs: [
    { name: 'General Labor', slug: 'general' }, { name: 'Forklift Operators', slug: 'forklift' },
    { name: 'Riggers', slug: 'riggers' },
  ]},
  { group: 'labor', name: 'Technicians', slug: 'technicians', subs: [
    { name: 'Audio Engineers', slug: 'audio-eng' }, { name: 'Lighting Designers', slug: 'ld' },
    { name: 'Video Engineers', slug: 'video-eng' }, { name: 'IT/Network', slug: 'it' },
  ]},
  { group: 'labor', name: 'Specialists', slug: 'specialists', subs: [
    { name: 'Pyro Techs', slug: 'pyro' }, { name: 'Drone Operators', slug: 'drone' },
    { name: 'Scenic Artists', slug: 'scenic-artist' },
  ]},
  // Custom
  { group: 'custom', name: 'Miscellaneous', slug: 'misc', subs: [
    { name: 'Office Supplies', slug: 'office' }, { name: 'Consumables', slug: 'consumables' },
    { name: 'Gifts & Swag', slug: 'gifts' },
  ]},
];

// ——— Item Definitions ———
interface ItemDef {
  cat: string; sub: string; name: string; code: string;
  desc: string; uom: string; price: number; // cents
  variants?: { name: string; sku: string; price: number }[];
}

const ITEMS: ItemDef[] = [
  // === ACCESS (40 items) ===
  { cat: 'badges', sub: 'all-access', name: 'All-Access Laminate', code: 'ACC-AA-001', desc: 'Full venue access laminate pass with lanyard', uom: 'each', price: 2500 },
  { cat: 'badges', sub: 'all-access', name: 'All-Access Wristband', code: 'ACC-AA-002', desc: 'Tyvek all-access wristband, one-time use', uom: 'each', price: 500 },
  { cat: 'badges', sub: 'backstage', name: 'Backstage Pass', code: 'ACC-BS-001', desc: 'Backstage area access laminate', uom: 'each', price: 2000 },
  { cat: 'badges', sub: 'backstage', name: 'Artist Guest Pass', code: 'ACC-BS-002', desc: 'Artist guest backstage wristband', uom: 'each', price: 1500 },
  { cat: 'badges', sub: 'vip', name: 'VIP Guest Pass', code: 'ACC-VIP-001', desc: 'VIP area access wristband', uom: 'each', price: 1200 },
  { cat: 'badges', sub: 'vip', name: 'VIP Table Card', code: 'ACC-VIP-002', desc: 'Printed VIP table reservation card', uom: 'each', price: 800 },
  { cat: 'badges', sub: 'crew-badge', name: 'Crew Credential Badge', code: 'ACC-CR-001', desc: 'Hard plastic crew badge with clip', uom: 'each', price: 1800 },
  { cat: 'badges', sub: 'crew-badge', name: 'Crew Day Pass', code: 'ACC-CR-002', desc: 'Disposable crew day pass', uom: 'each', price: 500 },
  { cat: 'badges', sub: 'parking', name: 'Lot A Parking Pass', code: 'ACC-PK-001', desc: 'Premium parking lot A vehicle pass', uom: 'each', price: 5000 },
  { cat: 'badges', sub: 'parking', name: 'Lot B Parking Pass', code: 'ACC-PK-002', desc: 'General parking lot B vehicle pass', uom: 'each', price: 2500 },
  { cat: 'credentials', sub: 'photo-id', name: 'Photo ID Badge', code: 'ACC-PH-001', desc: 'Personalized photo ID with hologram', uom: 'each', price: 3500 },
  { cat: 'credentials', sub: 'rfid', name: 'RFID Wristband – Standard', code: 'ACC-RF-001', desc: 'NFC wristband for access control', uom: 'each', price: 450 },
  { cat: 'credentials', sub: 'rfid', name: 'RFID Wristband – Cashless', code: 'ACC-RF-002', desc: 'NFC wristband with cashless payment', uom: 'each', price: 850 },
  { cat: 'credentials', sub: 'vehicle', name: 'Vehicle Placard', code: 'ACC-VP-001', desc: 'Hang tag vehicle access placard', uom: 'each', price: 1000 },
  // More access items
  ...Array.from({ length: 26 }, (_, i) => ({
    cat: ['badges', 'credentials'][i % 2] as string,
    sub: ['all-access', 'backstage', 'vip', 'crew-badge', 'parking', 'photo-id', 'rfid', 'vehicle'][i % 8] as string,
    name: `Access Item ${i + 15}`, code: `ACC-GEN-${String(i + 15).padStart(3, '0')}`,
    desc: `Generic access credential item`, uom: 'each', price: 500 + (i * 150),
  })),

  // === PRODUCTION (60 items) ===
  { cat: 'staging', sub: 'deck', name: '4×8 Stage Deck', code: 'PRD-DK-001', desc: 'Standard 4×8 portable stage deck', uom: 'each', price: 7500, variants: [
    { name: '16" Height', sku: 'PRD-DK-001-16', price: 7500 },
    { name: '24" Height', sku: 'PRD-DK-001-24', price: 8500 },
    { name: '32" Height', sku: 'PRD-DK-001-32', price: 9500 },
    { name: '48" Height', sku: 'PRD-DK-001-48', price: 12500 },
  ]},
  { cat: 'staging', sub: 'deck', name: '4×4 Drum Riser', code: 'PRD-DK-002', desc: '4×4 carpeted drum riser', uom: 'each', price: 5000 },
  { cat: 'staging', sub: 'truss', name: '12" Box Truss – 10ft', code: 'PRD-TR-001', desc: '12-inch aluminum box truss, 10ft section', uom: 'linear_ft', price: 1200 },
  { cat: 'staging', sub: 'truss', name: '20.5" Box Truss – 10ft', code: 'PRD-TR-002', desc: '20.5-inch aluminum box truss, 10ft section', uom: 'linear_ft', price: 1800 },
  { cat: 'staging', sub: 'truss', name: 'Ground Support Tower', code: 'PRD-TR-003', desc: 'Complete ground support tower package', uom: 'set', price: 250000 },
  { cat: 'staging', sub: 'drape', name: 'Black Velour Drape 10×20', code: 'PRD-DR-001', desc: 'Black velour drape panel 10ft × 20ft', uom: 'each', price: 6500 },
  { cat: 'staging', sub: 'drape', name: 'Pipe & Drape Kit', code: 'PRD-DR-002', desc: '8ft uprights with crossbar and drape', uom: 'set', price: 8500 },
  { cat: 'staging', sub: 'scenic', name: 'Custom Scenic Flat 4×8', code: 'PRD-SC-001', desc: 'Painted scenic flat, custom artwork', uom: 'each', price: 45000 },
  { cat: 'scenic-set', sub: 'backdrops', name: 'Printed Backdrop 20×10', code: 'PRD-BD-001', desc: 'Fabric printed backdrop with grommets', uom: 'each', price: 35000 },
  { cat: 'scenic-set', sub: 'props', name: 'Custom Props Package', code: 'PRD-PR-001', desc: 'Custom fabricated props package', uom: 'set', price: 75000 },
  { cat: 'scenic-set', sub: 'signage', name: 'Foam Core Sign 24×36', code: 'PRD-SG-001', desc: 'Full color foam core directional sign', uom: 'each', price: 3500 },
  { cat: 'scenic-set', sub: 'signage', name: 'Vinyl Banner 3×8', code: 'PRD-SG-002', desc: 'Full color vinyl banner with grommets', uom: 'each', price: 8500 },
  { cat: 'scenic-set', sub: 'furniture', name: 'Lounge Sofa', code: 'PRD-FN-001', desc: 'Modern lounge sofa, white leather', uom: 'each', price: 25000 },
  { cat: 'scenic-set', sub: 'furniture', name: 'Cocktail Table', code: 'PRD-FN-002', desc: '42" cocktail table with linen', uom: 'each', price: 5500 },
  { cat: 'scenic-set', sub: 'furniture', name: 'Barstool', code: 'PRD-FN-003', desc: 'Modern barstool, 30" height', uom: 'each', price: 4500 },
  { cat: 'tenting', sub: 'frame-tent', name: '20×20 Frame Tent', code: 'PRD-TN-001', desc: '20×20 clear span frame tent', uom: 'each', price: 125000 },
  { cat: 'tenting', sub: 'frame-tent', name: '40×60 Frame Tent', code: 'PRD-TN-002', desc: '40×60 clear span frame tent', uom: 'each', price: 450000 },
  { cat: 'tenting', sub: 'popup', name: '10×10 Pop-Up Canopy', code: 'PRD-TN-003', desc: '10×10 pop-up canopy with sidewalls', uom: 'each', price: 15000 },
  ...Array.from({ length: 42 }, (_, i) => ({
    cat: ['staging', 'scenic-set', 'tenting'][i % 3] as string,
    sub: ['deck', 'truss', 'drape', 'scenic', 'backdrops', 'props', 'signage', 'furniture', 'frame-tent', 'pole-tent', 'clear-span', 'popup'][i % 12] as string,
    name: `Production Item ${i + 19}`, code: `PRD-GEN-${String(i + 19).padStart(3, '0')}`,
    desc: `Production equipment rental item`, uom: ['each', 'linear_ft', 'set', 'sq_ft'][i % 4] as string,
    price: 5000 + (i * 500),
  })),

  // === TECHNICAL (80 items) ===
  { cat: 'audio', sub: 'pa', name: 'JBL VTX A12 Line Array', code: 'TEC-AU-001', desc: 'JBL VTX A12 line array element', uom: 'each', price: 75000 },
  { cat: 'audio', sub: 'pa', name: 'JBL VTX S28 Subwoofer', code: 'TEC-AU-002', desc: 'JBL VTX S28 dual 18" subwoofer', uom: 'each', price: 45000 },
  { cat: 'audio', sub: 'pa', name: 'QSC KLA Series Package', code: 'TEC-AU-003', desc: '8-element QSC KLA line array with subs', uom: 'set', price: 350000 },
  { cat: 'audio', sub: 'monitors', name: 'Wedge Monitor', code: 'TEC-AU-004', desc: '15" wedge stage monitor', uom: 'each', price: 15000 },
  { cat: 'audio', sub: 'monitors', name: 'IEM System', code: 'TEC-AU-005', desc: 'Wireless in-ear monitor system', uom: 'each', price: 25000 },
  { cat: 'audio', sub: 'microphones', name: 'SM58 Wireless', code: 'TEC-AU-006', desc: 'Shure SM58 wireless handheld', uom: 'each', price: 12500 },
  { cat: 'audio', sub: 'microphones', name: 'Lavalier Mic', code: 'TEC-AU-007', desc: 'Wireless lavalier microphone system', uom: 'each', price: 18000 },
  { cat: 'audio', sub: 'playback', name: 'DJ Package', code: 'TEC-AU-008', desc: 'CDJ-3000 pair with DJM-900NXS2', uom: 'set', price: 85000 },
  { cat: 'video', sub: 'led-walls', name: 'LED Wall Panel – 2.9mm', code: 'TEC-VD-001', desc: 'Indoor LED panel, 2.9mm pixel pitch', uom: 'sq_ft', price: 5500, variants: [
    { name: '2.9mm Indoor', sku: 'TEC-VD-001-29I', price: 5500 },
    { name: '3.9mm Indoor', sku: 'TEC-VD-001-39I', price: 4500 },
    { name: '3.9mm Outdoor', sku: 'TEC-VD-001-39O', price: 6500 },
    { name: '5.9mm Outdoor', sku: 'TEC-VD-001-59O', price: 3500 },
  ]},
  { cat: 'video', sub: 'projection', name: '20K Projector', code: 'TEC-VD-002', desc: '20,000 lumen laser projector', uom: 'each', price: 125000 },
  { cat: 'video', sub: 'projection', name: '30K Projector', code: 'TEC-VD-003', desc: '30,000 lumen laser projector', uom: 'each', price: 195000 },
  { cat: 'video', sub: 'cameras', name: 'PTZ Camera', code: 'TEC-VD-004', desc: 'PTZ camera with 30× zoom', uom: 'each', price: 35000 },
  { cat: 'video', sub: 'switching', name: 'Video Switcher', code: 'TEC-VD-005', desc: 'Blackmagic ATEM 4 M/E switcher', uom: 'each', price: 65000 },
  { cat: 'lighting', sub: 'movers', name: 'Clay Paky Sharpy Plus', code: 'TEC-LG-001', desc: 'Clay Paky Sharpy Plus beam/spot', uom: 'each', price: 35000 },
  { cat: 'lighting', sub: 'movers', name: 'Robe MegaPointe', code: 'TEC-LG-002', desc: 'Robe MegaPointe moving head', uom: 'each', price: 40000 },
  { cat: 'lighting', sub: 'wash', name: 'LED Wash 600', code: 'TEC-LG-003', desc: 'RGBW LED wash fixture 600W', uom: 'each', price: 18000 },
  { cat: 'lighting', sub: 'spots', name: 'Followspot 2500W', code: 'TEC-LG-004', desc: '2500W longthrow followspot', uom: 'each', price: 25000 },
  { cat: 'lighting', sub: 'atmospherics', name: 'Haze Machine', code: 'TEC-LG-005', desc: 'MDG TheONE haze machine', uom: 'each', price: 22000 },
  { cat: 'lighting', sub: 'atmospherics', name: 'CO2 Jet', code: 'TEC-LG-006', desc: 'CO2 cryo jet with 50lb tank', uom: 'each', price: 35000 },
  { cat: 'power', sub: 'generators', name: '100kW Generator', code: 'TEC-PW-001', desc: '100kW diesel generator, whisper quiet', uom: 'each', price: 175000 },
  { cat: 'power', sub: 'generators', name: '250kW Generator', code: 'TEC-PW-002', desc: '250kW diesel generator with fuel', uom: 'each', price: 350000 },
  { cat: 'power', sub: 'distro', name: 'Power Distro 400A', code: 'TEC-PW-003', desc: '400A power distribution panel', uom: 'each', price: 45000 },
  { cat: 'power', sub: 'cable', name: 'Feeder Cable 100ft', code: 'TEC-PW-004', desc: '4/0 feeder cable 100ft run', uom: 'each', price: 8500 },
  ...Array.from({ length: 57 }, (_, i) => ({
    cat: ['audio', 'video', 'lighting', 'power'][i % 4] as string,
    sub: ['pa', 'monitors', 'microphones', 'playback', 'led-walls', 'projection', 'cameras', 'switching', 'movers', 'wash', 'spots', 'atmospherics', 'generators', 'distro', 'cable'][i % 15] as string,
    name: `Technical Item ${i + 24}`, code: `TEC-GEN-${String(i + 24).padStart(3, '0')}`,
    desc: `Technical production equipment`, uom: ['each', 'sq_ft', 'set'][i % 3] as string,
    price: 10000 + (i * 750),
  })),

  // === HOSPITALITY (45 items) ===
  { cat: 'catering', sub: 'meals', name: 'Crew Breakfast', code: 'HOS-ML-001', desc: 'Hot breakfast buffet per person', uom: 'person', price: 1800 },
  { cat: 'catering', sub: 'meals', name: 'Crew Lunch', code: 'HOS-ML-002', desc: 'Boxed lunch per person', uom: 'person', price: 2200 },
  { cat: 'catering', sub: 'meals', name: 'Crew Dinner', code: 'HOS-ML-003', desc: 'Hot dinner buffet per person', uom: 'person', price: 2800 },
  { cat: 'catering', sub: 'snacks', name: 'Snack Table', code: 'HOS-SN-001', desc: 'All-day snack and beverage table', uom: 'day', price: 45000 },
  { cat: 'catering', sub: 'snacks', name: 'Coffee Service', code: 'HOS-SN-002', desc: 'Specialty coffee service per 50 people', uom: 'each', price: 35000 },
  { cat: 'catering', sub: 'late-night', name: 'Late Night Pizza', code: 'HOS-LN-001', desc: 'Pizza delivery for late crew, 20 pies', uom: 'each', price: 50000 },
  { cat: 'facilities', sub: 'restrooms', name: 'Porta-John Standard', code: 'HOS-RR-001', desc: 'Standard portable restroom', uom: 'each', price: 22500 },
  { cat: 'facilities', sub: 'restrooms', name: 'Luxury Restroom Trailer', code: 'HOS-RR-002', desc: '4-station luxury restroom trailer', uom: 'each', price: 225000 },
  { cat: 'facilities', sub: 'hvac', name: 'Portable AC Unit', code: 'HOS-HV-001', desc: '5-ton portable AC unit', uom: 'each', price: 85000 },
  { cat: 'facilities', sub: 'waste', name: 'Dumpster 20yd', code: 'HOS-WS-001', desc: '20-yard roll-off dumpster', uom: 'each', price: 75000 },
  { cat: 'site-services', sub: 'security', name: 'Security Guard', code: 'HOS-SC-001', desc: 'Uniformed security guard, 8hr shift', uom: 'hour', price: 4500 },
  { cat: 'site-services', sub: 'medical', name: 'EMT On-Site', code: 'HOS-MD-001', desc: 'EMT with basic medical kit, 8hr shift', uom: 'hour', price: 6500 },
  { cat: 'site-services', sub: 'cleaning', name: 'Cleaning Crew', code: 'HOS-CL-001', desc: 'Cleaning crew of 4 per 8hr shift', uom: 'hour', price: 12000 },
  ...Array.from({ length: 32 }, (_, i) => ({
    cat: ['catering', 'facilities', 'site-services'][i % 3] as string,
    sub: ['meals', 'snacks', 'late-night', 'restrooms', 'hvac', 'waste', 'security', 'medical', 'cleaning'][i % 9] as string,
    name: `Hospitality Item ${i + 14}`, code: `HOS-GEN-${String(i + 14).padStart(3, '0')}`,
    desc: `Hospitality and site service item`, uom: ['person', 'each', 'day', 'hour'][i % 4] as string,
    price: 2000 + (i * 400),
  })),

  // === TRAVEL (40 items) ===
  { cat: 'ground', sub: 'vans', name: '15-Passenger Van', code: 'TRV-VN-001', desc: '15-passenger van rental, daily rate', uom: 'day', price: 25000 },
  { cat: 'ground', sub: 'box-trucks', name: '26ft Box Truck', code: 'TRV-BT-001', desc: '26ft box truck with lift gate, daily rate', uom: 'day', price: 35000 },
  { cat: 'ground', sub: 'flatbeds', name: '48ft Flatbed', code: 'TRV-FB-001', desc: '48ft flatbed trailer with driver, daily rate', uom: 'day', price: 85000 },
  { cat: 'ground', sub: 'sedans', name: 'Town Car Service', code: 'TRV-SD-001', desc: 'Sedan town car service, hourly', uom: 'hour', price: 8500 },
  { cat: 'freight', sub: 'ltl', name: 'LTL Freight Pallet', code: 'TRV-LT-001', desc: 'LTL freight per pallet, regional', uom: 'pallet', price: 25000 },
  { cat: 'freight', sub: 'ftl', name: 'Full Truckload', code: 'TRV-FT-001', desc: 'FTL freight, regional 500mi', uom: 'each', price: 350000 },
  { cat: 'freight', sub: 'air', name: 'Air Freight 100lb', code: 'TRV-AF-001', desc: 'Air freight per 100 lbs, next day', uom: 'lb', price: 1200 },
  { cat: 'accommodations', sub: 'hotel', name: 'Hotel Room – Standard', code: 'TRV-HT-001', desc: 'Standard hotel room, single night', uom: 'each', price: 17500, variants: [
    { name: 'Standard', sku: 'TRV-HT-001-STD', price: 17500 },
    { name: 'Upgraded', sku: 'TRV-HT-001-UPG', price: 25000 },
    { name: 'Suite', sku: 'TRV-HT-001-STE', price: 45000 },
  ]},
  { cat: 'accommodations', sub: 'per-diem', name: 'Per Diem – Standard', code: 'TRV-PD-001', desc: 'Daily per diem allowance', uom: 'person', price: 7500 },
  ...Array.from({ length: 31 }, (_, i) => ({
    cat: ['ground', 'freight', 'accommodations'][i % 3] as string,
    sub: ['vans', 'box-trucks', 'flatbeds', 'sedans', 'ltl', 'ftl', 'air', 'hotel', 'per-diem'][i % 9] as string,
    name: `Travel Item ${i + 10}`, code: `TRV-GEN-${String(i + 10).padStart(3, '0')}`,
    desc: `Travel and transport service item`, uom: ['day', 'hour', 'each', 'lb'][i % 4] as string,
    price: 5000 + (i * 600),
  })),

  // === LABOR (60 items) ===
  { cat: 'stagehands', sub: 'general', name: 'Stagehand – 8hr Call', code: 'LAB-SH-001', desc: 'General stagehand, 8-hour call', uom: 'each', price: 35000 },
  { cat: 'stagehands', sub: 'general', name: 'Stagehand – OT Rate', code: 'LAB-SH-002', desc: 'Stagehand overtime per hour', uom: 'hour', price: 6500 },
  { cat: 'stagehands', sub: 'forklift', name: 'Forklift Operator', code: 'LAB-FK-001', desc: 'Certified forklift operator, 8hr call', uom: 'each', price: 55000 },
  { cat: 'stagehands', sub: 'riggers', name: 'Rigger – Certified', code: 'LAB-RG-001', desc: 'Certified rigger, 8hr call', uom: 'each', price: 65000 },
  { cat: 'stagehands', sub: 'riggers', name: 'Head Rigger', code: 'LAB-RG-002', desc: 'Head rigger with certifications, 10hr call', uom: 'each', price: 95000 },
  { cat: 'technicians', sub: 'audio-eng', name: 'FOH Engineer', code: 'LAB-AE-001', desc: 'Front-of-house audio engineer, full day', uom: 'day', price: 125000 },
  { cat: 'technicians', sub: 'audio-eng', name: 'Monitor Engineer', code: 'LAB-AE-002', desc: 'Monitor engineer, full day', uom: 'day', price: 110000 },
  { cat: 'technicians', sub: 'ld', name: 'Lighting Designer', code: 'LAB-LD-001', desc: 'Lighting designer, full day', uom: 'day', price: 150000 },
  { cat: 'technicians', sub: 'ld', name: 'Lighting Programmer', code: 'LAB-LD-002', desc: 'Lighting console programmer, full day', uom: 'day', price: 125000 },
  { cat: 'technicians', sub: 'video-eng', name: 'Video Director', code: 'LAB-VE-001', desc: 'Video director / TD, full day', uom: 'day', price: 175000 },
  { cat: 'technicians', sub: 'video-eng', name: 'Camera Operator', code: 'LAB-VE-002', desc: 'Camera operator, full day', uom: 'day', price: 85000 },
  { cat: 'technicians', sub: 'it', name: 'Network Engineer', code: 'LAB-IT-001', desc: 'Network/IT engineer, full day', uom: 'day', price: 135000 },
  { cat: 'specialists', sub: 'pyro', name: 'Pyrotechnics Crew', code: 'LAB-PY-001', desc: 'Licensed pyro crew, full show', uom: 'each', price: 500000 },
  { cat: 'specialists', sub: 'drone', name: 'Drone Show Package', code: 'LAB-DR-001', desc: 'Drone light show, 100 units', uom: 'each', price: 2500000 },
  { cat: 'specialists', sub: 'scenic-artist', name: 'Scenic Painter', code: 'LAB-SA-001', desc: 'Professional scenic painter, full day', uom: 'day', price: 95000 },
  ...Array.from({ length: 45 }, (_, i) => ({
    cat: ['stagehands', 'technicians', 'specialists'][i % 3] as string,
    sub: ['general', 'forklift', 'riggers', 'audio-eng', 'ld', 'video-eng', 'it', 'pyro', 'drone', 'scenic-artist'][i % 10] as string,
    name: `Labor Item ${i + 16}`, code: `LAB-GEN-${String(i + 16).padStart(3, '0')}`,
    desc: `Labor and crew service`, uom: ['each', 'day', 'hour'][i % 3] as string,
    price: 25000 + (i * 1000),
  })),

  // === CUSTOM (26 items) ===
  { cat: 'misc', sub: 'office', name: 'Production Office Kit', code: 'CST-OF-001', desc: 'Printer, supplies, whiteboards, stationery', uom: 'set', price: 45000 },
  { cat: 'misc', sub: 'consumables', name: 'Gaffer Tape Case', code: 'CST-CS-001', desc: 'Case of 24 rolls gaffer tape', uom: 'case', price: 18000 },
  { cat: 'misc', sub: 'consumables', name: 'Cable Ties 1000ct', code: 'CST-CS-002', desc: 'Bag of 1000 cable ties, black', uom: 'each', price: 2500 },
  { cat: 'misc', sub: 'gifts', name: 'Crew Gift Bag', code: 'CST-GF-001', desc: 'Branded crew gift bag with t-shirt', uom: 'each', price: 3500 },
  { cat: 'misc', sub: 'gifts', name: 'Client Gift Box', code: 'CST-GF-002', desc: 'Premium client gift box', uom: 'each', price: 12500 },
  ...Array.from({ length: 21 }, (_, i) => ({
    cat: 'misc',
    sub: ['office', 'consumables', 'gifts'][i % 3] as string,
    name: `Custom Item ${i + 6}`, code: `CST-GEN-${String(i + 6).padStart(3, '0')}`,
    desc: `Miscellaneous production item`, uom: ['each', 'set', 'case'][i % 3] as string,
    price: 1500 + (i * 300),
  })),
];

// ——— Modifier Lists ———
const MODIFIER_LISTS = [
  { name: 'Rush Fee', slug: 'rush', selection_type: 'boolean' as const, options: [
    { name: 'Standard', price: 0 }, { name: 'Rush (24hr)', price: 5000 }, { name: 'Emergency (same day)', price: 15000 },
  ]},
  { name: 'Installation', slug: 'install', selection_type: 'list' as const, options: [
    { name: 'Self Install', price: 0 }, { name: 'Basic Install', price: 7500 }, { name: 'Full Install w/ Touchup', price: 15000 },
  ]},
  { name: 'Delivery', slug: 'delivery', selection_type: 'list' as const, options: [
    { name: 'Customer Pickup', price: 0 }, { name: 'Standard Delivery', price: 12500 }, { name: 'White Glove', price: 35000 },
  ]},
  { name: 'Duration Extension', slug: 'duration', selection_type: 'quantity' as const, options: [
    { name: 'Extra Day', price: 5000 }, { name: 'Extra Week', price: 25000 },
  ]},
  { name: 'Insurance Add-On', slug: 'insurance', selection_type: 'boolean' as const, options: [
    { name: 'No Coverage', price: 0 }, { name: 'Damage Waiver', price: 2500 }, { name: 'Full Replacement', price: 7500 },
  ]},
];

// ——— Main seed function ———
async function seed() {
  // Assumes we use a specific org for seeding — pull the first active org
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1).single();
  if (!orgs) { console.error('No org found'); process.exit(1); }
  const orgId = orgs.id;

  console.log(`Seeding catalog for org ${orgId}...`);

  // 1. Insert category groups
  const groupRows = GROUPS.map((g) => ({
    id: g.id, organization_id: orgId, name: g.name, slug: g.slug,
    sort_order: g.sort_order, icon: g.icon, description: g.description, is_active: true,
  }));
  const { error: gErr } = await supabase.from('advance_category_groups').upsert(groupRows, { onConflict: 'organization_id,slug', ignoreDuplicates: true });
  if (gErr) { console.error('Groups error:', gErr); process.exit(1); }
  console.log(`  ✓ ${groupRows.length} category groups`);

  // 2. Insert categories & subcategories
  const catRows: Array<Record<string, unknown>> = [];
  const subRows: Array<Record<string, unknown>> = [];
  const catIdMap: Record<string, string> = {};
  const subIdMap: Record<string, string> = {};

  CATEGORIES.forEach((c, ci) => {
    const catId = uuid();
    catIdMap[c.slug] = catId;
    catRows.push({
      id: catId, organization_id: orgId, group_id: groupMap[c.group],
      name: c.name, slug: c.slug, sort_order: ci + 1, is_active: true,
    });
    c.subs.forEach((s, si) => {
      const subId = uuid();
      subIdMap[s.slug] = subId;
      subRows.push({
        id: subId, organization_id: orgId, category_id: catId,
        name: s.name, slug: s.slug, sort_order: si + 1, is_active: true,
      });
    });
  });

  const { error: cErr } = await supabase.from('advance_categories').upsert(catRows, { onConflict: 'id', ignoreDuplicates: true });
  if (cErr) { console.error('Categories error:', cErr); process.exit(1); }
  console.log(`  ✓ ${catRows.length} categories`);

  const { error: sErr } = await supabase.from('advance_subcategories').upsert(subRows, { onConflict: 'id', ignoreDuplicates: true });
  if (sErr) { console.error('Subcategories error:', sErr); process.exit(1); }
  console.log(`  ✓ ${subRows.length} subcategories`);

  // 3. Insert modifier lists & options
  const modListRows: Array<Record<string, unknown>> = [];
  const modOptRows: Array<Record<string, unknown>> = [];
  const modListIdMap: Record<string, string> = {};

  MODIFIER_LISTS.forEach((ml, mli) => {
    const listId = uuid();
    modListIdMap[ml.slug] = listId;
    modListRows.push({
      id: listId, organization_id: orgId, name: ml.name,
      selection_type: ml.selection_type, sort_order: mli + 1,
    });
    ml.options.forEach((opt, oi) => {
      modOptRows.push({
        id: uuid(), modifier_list_id: listId, organization_id: orgId,
        name: opt.name, price_adjustment_cents: opt.price, sort_order: oi + 1, is_active: true,
      });
    });
  });

  const { error: mlErr } = await supabase.from('advance_modifier_lists').upsert(modListRows, { onConflict: 'id', ignoreDuplicates: true });
  if (mlErr) { console.error('Modifier lists error:', mlErr); process.exit(1); }
  console.log(`  ✓ ${modListRows.length} modifier lists`);

  const { error: moErr } = await supabase.from('advance_modifier_options').upsert(modOptRows, { onConflict: 'id', ignoreDuplicates: true });
  if (moErr) { console.error('Modifier options error:', moErr); process.exit(1); }
  console.log(`  ✓ ${modOptRows.length} modifier options`);

  // 4. Insert catalog items & variants
  const itemRows: Array<Record<string, unknown>> = [];
  const variantRows: Array<Record<string, unknown>> = [];
  const itemModListRows: Array<Record<string, unknown>> = [];

  ITEMS.forEach((item, ii) => {
    const itemId = uuid();
    const subId = subIdMap[item.sub];
    if (!subId) return; // skip if subcategory not found

    itemRows.push({
      id: itemId, organization_id: orgId, subcategory_id: subId,
      name: item.name, item_code: item.code, description: item.desc,
      default_unit_of_measure: item.uom,
      pricing_strategy: 'fixed', is_active: true, sort_order: ii + 1,
    });

    // Add variants
    if (item.variants) {
      item.variants.forEach((v, vi) => {
        variantRows.push({
          id: uuid(), item_id: itemId, organization_id: orgId,
          name: v.name, sku: v.sku, price_cents: v.price,
          sort_order: vi + 1, is_active: true,
        });
      });
    } else {
      // Default variant
      variantRows.push({
        id: uuid(), item_id: itemId, organization_id: orgId,
        name: 'Standard', sku: item.code, price_cents: item.price,
        sort_order: 1, is_active: true,
      });
    }

    // Attach modifier lists (rush + delivery for most items)
    const rushId = modListIdMap['rush'];
    const deliveryId = modListIdMap['delivery'];
    if (rushId) {
      itemModListRows.push({ item_id: itemId, modifier_list_id: rushId });
    }
    if (deliveryId) {
      itemModListRows.push({ item_id: itemId, modifier_list_id: deliveryId });
    }
  });

  // Batch insert items
  for (let i = 0; i < itemRows.length; i += 50) {
    const batch = itemRows.slice(i, i + 50);
    const { error: iErr } = await supabase.from('advance_catalog_items').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (iErr) { console.error(`Items batch ${i} error:`, iErr); process.exit(1); }
  }
  console.log(`  ✓ ${itemRows.length} catalog items`);

  // Batch insert variants
  for (let i = 0; i < variantRows.length; i += 50) {
    const batch = variantRows.slice(i, i + 50);
    const { error: vErr } = await supabase.from('advance_catalog_variants').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (vErr) { console.error(`Variants batch ${i} error:`, vErr); process.exit(1); }
  }
  console.log(`  ✓ ${variantRows.length} variants`);

  // Batch insert item<>modifier assignments
  for (let i = 0; i < itemModListRows.length; i += 50) {
    const batch = itemModListRows.slice(i, i + 50);
    const { error: imErr } = await supabase.from('advance_item_modifier_lists').insert(batch);
    if (imErr) { console.error(`Item-modifiers batch ${i} error:`, imErr); process.exit(1); }
  }
  console.log(`  ✓ ${itemModListRows.length} item↔modifier assignments`);

  console.log(`\n✅ Seeded ${itemRows.length} catalog items with ${variantRows.length} variants.`);
}

seed().catch((err) => { console.error(err); process.exit(1); });
