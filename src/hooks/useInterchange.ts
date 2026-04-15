import { useState, useEffect } from 'react';

interface InterchangeAlternativeItem {
  id: string;
  name: string;
  item_code: string | null;
  manufacturer: string | null;
  is_discontinued?: boolean;
}

interface InterchangeRecord {
  interchange_id: string;
  relationship_type: string;
  compatibility_score: number;
  comparison_data: Record<string, unknown>;
  valid_contexts: string[];
  alternative_item: InterchangeAlternativeItem;
}

interface InterchangeResponse {
  data?: InterchangeRecord[];
  error?: string;
}

export function useInterchange(itemId: string | null) {
  const [data, setData] = useState<InterchangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!itemId) {
      return;
    }

    let isMounted = true;

    const loadInterchange = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/advances/catalog/${itemId}/interchange`);
        const json = (await res.json()) as InterchangeResponse;
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Failed to fetch interchange records');
        }
        if (isMounted) {
          setData(json.data ?? []);
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

    void loadInterchange();

    return () => { isMounted = false; };
  }, [itemId]);

  return {
    data: itemId ? data : [],
    loading: itemId ? loading : false,
    error: itemId ? error : null,
  };
}
