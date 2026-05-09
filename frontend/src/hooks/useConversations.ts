import { useState, useEffect, useCallback } from 'react';
import { listConversations, deleteConversation } from '../services/chat';
import type { Conversation } from '../types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function newConversation(): Conversation {
  return {
    id: generateId(),
    title: 'New Session',
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0,
    retrievalMode: 'hybrid',
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation>(() => newConversation());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listConversations()
      .then(data => {
        setConversations(data);
        if (data.length > 0) setActive(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createNew = useCallback(() => {
    const c = newConversation();
    setConversations(prev => [c, ...prev]);
    setActive(c);
    return c;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteConversation(id).catch(() => {});
    setConversations(prev => prev.filter(c => c.id !== id));
    setActive(prev => (prev.id === id ? newConversation() : prev));
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title, updatedAt: new Date() } : c))
    );
  }, []);

  return { conversations, active, setActive, createNew, remove, updateTitle, loading };
}
