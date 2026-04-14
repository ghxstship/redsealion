import { useState, useCallback } from 'react';

interface FitmentSearchFilters {
  dimensions?: Record<string, string>;
  collection?: string;
}

interface FitmentResult {
  item_id: string;
  item_name: string;
  collection_name: string;
  category_name: string;
  avg_fit_rating: number;
  matching_dimensions: number;
}

export function useFitment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<FitmentResult[]>([]);

  const searchFitment = useCallback(async (filters: FitmentSearchFilters) => {
    setLoading(true);
    try {
      const res = await fetch('/api/advances/catalog/fitment/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResults(json.data || []);
      return json.data as FitmentResult[];
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFitmentDimensions = useCallback(async (collection?: string) => {
    const url = collection ? `/api/advances/catalog/fitment?collection=${collection}` : '/api/advances/catalog/fitment';
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data || [];
  }, []);

  return { results, loading, error, searchFitment, getFitmentDimensions };
}
