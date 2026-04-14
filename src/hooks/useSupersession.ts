import { useState, useEffect } from 'react';
import type { SupersessionChainNode } from '@/lib/advances/types';

export function useSupersession(itemId: string | null) {
  const [chain, setChain] = useState<SupersessionChainNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!itemId) {
      setChain([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/advances/catalog/${itemId}/supersession`)
      .then(res => res.json())
      .then(json => {
        if (!isMounted) return;
        if (json.error) throw new Error(json.error);
        setChain(json.data || []);
      })
      .catch(err => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [itemId]);

  const latestItem = chain.find(n => n.chain_position === Math.max(...chain.map(c => c.chain_position)));

  return { chain, latestItem, loading, error };
}
