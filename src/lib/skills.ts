/**
 * Skill taxonomy and matching utilities.
 *
 * Provides a searchable skill taxonomy for crew members and
 * a matching algorithm to find crew with required skills.
 *
 * @module lib/skills
 */

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export const SKILL_TAXONOMY: SkillCategory[] = [
  {
    id: 'production',
    name: 'Production',
    skills: [
      'Event Producer',
      'Production Manager',
      'Stage Manager',
      'Show Caller',
      'Site Manager',
      'Technical Director',
      'Project Coordinator',
    ],
  },
  {
    id: 'design',
    name: 'Design & Creative',
    skills: [
      '3D Designer',
      'Graphic Designer',
      'Industrial Designer',
      'Environmental Designer',
      'UX Designer',
      'Motion Graphics',
      'CAD Specialist',
      'Art Director',
    ],
  },
  {
    id: 'fabrication',
    name: 'Fabrication',
    skills: [
      'Carpenter',
      'Welder',
      'CNC Operator',
      'Painter / Finisher',
      'Upholsterer',
      'Scenic Artist',
      'Composite Technician',
      'Vinyl Wrapper',
    ],
  },
  {
    id: 'av',
    name: 'Audio / Visual',
    skills: [
      'Audio Engineer',
      'Lighting Designer',
      'Video Engineer',
      'LED Technician',
      'Projection Specialist',
      'AV Generalist',
      'Streaming Technician',
    ],
  },
  {
    id: 'rigging',
    name: 'Rigging & Electrical',
    skills: [
      'Rigger',
      'Electrician',
      'Power Distribution',
      'Signal Technician',
      'Truss Specialist',
      'Chain Motor Operator',
    ],
  },
  {
    id: 'logistics',
    name: 'Logistics',
    skills: [
      'CDL Driver',
      'Forklift Operator',
      'Logistics Coordinator',
      'Warehouse Manager',
      'Shipping / Receiving',
      'Load-In Lead',
      'Strike Lead',
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    skills: [
      'Interactive Developer',
      'AR/VR Developer',
      'Software Engineer',
      'Network Administrator',
      'IoT Specialist',
      'Touch Screen Programmer',
    ],
  },
  {
    id: 'staffing',
    name: 'Staffing & Brand Ambassadors',
    skills: [
      'Brand Ambassador',
      'Registration Staff',
      'VIP Host',
      'Greeter',
      'Crowd Management',
      'Catering Liaison',
    ],
  },
];

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Get all skills as a flat list for autocomplete / selection.
 */
export function getAllSkills(): string[] {
  return SKILL_TAXONOMY.flatMap((cat) => cat.skills).sort();
}

/**
 * Search skills by query string.
 */
export function searchSkills(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllSkills();
  return getAllSkills().filter((skill) => skill.toLowerCase().includes(q));
}

/**
 * Check if a crew member has all required skills.
 */
export function hasRequiredSkills(
  memberSkills: string[],
  requiredSkills: string[],
): boolean {
  const normalizedMember = new Set(memberSkills.map((s) => s.toLowerCase()));
  return requiredSkills.every((req) => normalizedMember.has(req.toLowerCase()));
}

/**
 * Score a crew member's skill match (0-100) against requirements.
 * Returns the percentage of required skills they possess.
 */
export function skillMatchScore(
  memberSkills: string[],
  requiredSkills: string[],
): number {
  if (requiredSkills.length === 0) return 100;
  const normalizedMember = new Set(memberSkills.map((s) => s.toLowerCase()));
  const matches = requiredSkills.filter((req) =>
    normalizedMember.has(req.toLowerCase()),
  ).length;
  return Math.round((matches / requiredSkills.length) * 100);
}

/**
 * Get the category for a given skill.
 */
export function getSkillCategory(skill: string): string | null {
  const s = skill.toLowerCase();
  for (const cat of SKILL_TAXONOMY) {
    if (cat.skills.some((cs) => cs.toLowerCase() === s)) {
      return cat.name;
    }
  }
  return null;
}
