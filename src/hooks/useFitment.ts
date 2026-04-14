import { useState, useCallback } from 'react';

export function useFitment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const searchFitment = useCallback(async (filters: any) => {
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
      return json.data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFitmentDimensions = useCallback(async (collection?: string) => {
    try {
      const url = collection ? `/api/advances/catalog/fitment?collection=${collection}` : '/api/advances/catalog/fitment';
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data || [];
    } catch (err: any) {
      throw err;
    }
  }, []);

  return { results, loading, error, searchFitment, getFitmentDimensions };
}
