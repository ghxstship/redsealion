import { useState, useCallback } from 'react';

export function useQuickQuote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [quote, setQuote] = useState<any>(null);

  const generateQuote = useCallback(async (items: any[], projectId?: string, days: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/advances/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, project_id: projectId, days })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate quote');
      setQuote(json.data);
      return json.data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { quote, loading, error, generateQuote };
}
