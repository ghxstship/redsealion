import { useState, useEffect } from 'react';

export function useInterchange(itemId: string | null) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!itemId) {
      setData([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/advances/catalog/${itemId}/interchange`)
      .then(res => res.json())
      .then(json => {
        if (!isMounted) return;
        if (json.error) throw new Error(json.error);
        setData(json.data || []);
      })
      .catch(err => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [itemId]);

  return { data, loading, error };
}
