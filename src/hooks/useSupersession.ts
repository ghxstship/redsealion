import { useState, useEffect } from 'react';
import type { SupersessionChainNode } from '@/lib/advances/types';

interface SupersessionResponse {
  data?: SupersessionChainNode[];
  error?: string;
}

export function useSupersession(itemId: string | null) {
  const [chain, setChain] = useState<SupersessionChainNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!itemId) {
      return;
    }

    let isMounted = true;

    const loadSupersession = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/advances/catalog/${itemId}/supersession`);
        const json = (await res.json()) as SupersessionResponse;
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Failed to fetch supersession chain');
        }

        if (isMounted) {
          setChain(json.data ?? []);
        }
      } catch (err: unknown) {
        const normalizedError = err instanceof Error ? err : new Error(String(err));
        if (isMounted) {
          setError(normalizedError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSupersession();

    return () => { isMounted = false; };
  }, [itemId]);

  const visibleChain = itemId ? chain : [];
  const latestItem = visibleChain.reduce<SupersessionChainNode | undefined>((latest, current) => {
    if (!latest || current.chain_position > latest.chain_position) {
      return current;
    }
    return latest;
  }, undefined);

  return {
    chain: visibleChain,
    latestItem,
    loading: itemId ? loading : false,
    error: itemId ? error : null,
  };
}
