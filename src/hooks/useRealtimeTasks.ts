'use client';

/**
 * Real-time task subscription hook — uses Supabase Realtime
 * to automatically refresh task data on INSERT/UPDATE/DELETE.
 *
 * @module hooks/useRealtimeTasks
 */

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseRealtimeTasksOptions {
  organizationId: string;
  onUpdate: () => void;
}

export function useRealtimeTasks({ organizationId, onUpdate }: UseRealtimeTasksOptions) {
  useEffect(() => {
    if (!organizationId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`tasks-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          onUpdate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, onUpdate]);
}
