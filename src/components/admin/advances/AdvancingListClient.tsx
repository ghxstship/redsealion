'use client';

import { useState } from 'react';
import AdvanceListTable from '@/components/admin/advances/AdvanceListTable';
import type { AdvanceStatus, AdvanceMode, AdvanceType, AdvancePriority } from '@/types/database';

interface AdvanceListItem {
  id: string;
  advance_number: string;
  advance_mode: AdvanceMode;
  advance_type: AdvanceType;
  status: AdvanceStatus;
  priority: AdvancePriority;
  event_name: string | null;
  venue_name: string | null;
  service_start_date: string | null;
  service_end_date: string | null;
  total_cents: number;
  line_item_count: number;
  submission_deadline: string | null;
  created_at: string;
  projects?: { name: string } | null;
}

interface AdvancingListClientProps {
  advances: AdvanceListItem[];
}

export default function AdvancingListClient({ advances }: AdvancingListClientProps) {
  const [tab, setTab] = useState('all');
  return <AdvanceListTable advances={advances} activeTab={tab} onTabChange={setTab} />;
}
