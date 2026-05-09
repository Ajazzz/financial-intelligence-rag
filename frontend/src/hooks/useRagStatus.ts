import { useState, useEffect } from 'react';
import { getRagStatus, listCollections } from '../services/rag';
import type { RagStatus } from '../services/rag';
import type { DocumentCollection } from '../types';

export function useRagStatus() {
  const [status, setStatus] = useState<RagStatus | null>(null);
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [s, c] = await Promise.all([getRagStatus(), listCollections()]);
        if (!cancelled) {
          setStatus(s);
          setCollections(c);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to connect to backend');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { status, collections, loading, error };
}
