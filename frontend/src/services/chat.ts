import request from './api';
import type { ChatRequest, ChatResponse, Conversation } from '../types';

export async function sendMessage(payload: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function streamMessage(
  payload: ChatRequest,
  onChunk: (text: string) => void,
  onDone: (meta: Omit<ChatResponse, 'answer'>) => void,
  signal?: AbortSignal
): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const res = await fetch(`${API_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data) as {
          type: 'token' | 'meta';
          content?: string;
          meta?: Omit<ChatResponse, 'answer'>;
        };

        if (parsed.type === 'token' && parsed.content) {
          onChunk(parsed.content);
        } else if (parsed.type === 'meta' && parsed.meta) {
          onDone(parsed.meta);
        }
      } catch {
        // malformed SSE chunk — skip
      }
    }
  }
}

export async function listConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/api/conversations');
}

export async function getConversation(id: string): Promise<Conversation & { messages: unknown[] }> {
  return request(`/api/conversations/${id}`);
}

export async function deleteConversation(id: string): Promise<void> {
  await request(`/api/conversations/${id}`, { method: 'DELETE' });
}
