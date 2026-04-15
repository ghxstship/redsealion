import { useState, useCallback } from 'react';

export interface QuoteLineItem {
  catalog_item_id: string;
  quantity: number;
}

interface QuoteResult {
  lines: Array<{
    item_name: string;
    quantity: number;
    daily_rate_cents: number;
    days_applied: number;
    line_total_cents: number;
  }>;
  total_cents: number;
}

export function useQuickQuote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const generateQuote = useCallback(async (items: QuoteLineItem[], projectId?: string, days: number = 1) => {
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
      return json.data as QuoteResult;
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { quote, loading, error, generateQuote };
}
