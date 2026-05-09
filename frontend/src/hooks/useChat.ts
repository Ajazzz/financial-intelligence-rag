import { useState, useCallback, useRef } from 'react';
import { streamMessage } from '../services/chat';
import type { Message, MessageMetadata, RetrievalMode, DocumentCollection } from '../types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      content: string,
      retrievalMode: RetrievalMode,
      collections: DocumentCollection[]
    ) => {
      setError(null);

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);

      const assistantId = generateId();
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const startTime = Date.now();

      try {
        await streamMessage(
          {
            query: content,
            conversationId,
            retrievalMode,
            collectionIds: collections.filter(c => c.active).map(c => c.id),
          },
          (token) => {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + token } : m
              )
            );
          },
          (meta) => {
            const metadata: MessageMetadata = {
              latencyMs: Date.now() - startTime,
              tokensUsed: meta.tokensUsed,
              retrievalMode,
              sourceCount: meta.sources?.length ?? 0,
              confidenceScore: meta.confidenceScore,
              sources: meta.sources,
              queryAnalysis: meta.queryAnalysis,
              retrievalDebug: meta.retrievalDebug,
            };

            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, metadata } : m
              )
            );
          },
          controller.signal
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'An error occurred';
        setError(msg);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: '', metadata: { latencyMs: Date.now() - startTime } }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [conversationId]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, abort, clearMessages };
}
