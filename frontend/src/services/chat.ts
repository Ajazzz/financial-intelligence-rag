import request from './api';

import type {
  ChatRequest,
  ChatResponse,
  Conversation
} from '../types';

export async function sendMessage(
  payload: ChatRequest
): Promise<ChatResponse> {

  return request<ChatResponse>(
    '/api/query',
    {
      method: 'POST',
      body: JSON.stringify({
        query: payload.query
      }),
    }
  );
}

export async function streamMessage(
  payload: ChatRequest,
  onChunk: (text: string) => void,
  onDone: (
    meta: Omit<ChatResponse, 'answer'>
  ) => void,
  signal?: AbortSignal
): Promise<void> {

  const API_URL =
    import.meta.env.VITE_API_URL ??
    'http://localhost:8000';

  const startTime = Date.now();

  const res = await fetch(
    `${API_URL}/api/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: payload.query
      }),
      signal,
    }
  );

  if (!res.ok) {

    throw new Error(
      `Request failed: ${res.status}`
    );

  }

  const data = await res.json();

  const answer =
    data.answer ??
    data.response ??
    '';

  onChunk(answer);

  onDone({
    latencyMs:
      Date.now() - startTime,

    tokensUsed: 0,

    sources:
      data.sources ?? [],

    confidenceScore: 1,

    retrievalDebug:
    data.retrievalDebug ?? {},

    queryAnalysis:
    data.queryAnalysis ?? {},
  });
}

//
// Conversation placeholders
//

export async function listConversations():
Promise<Conversation[]> {

  return [];
}

export async function getConversation(
  id: string
): Promise<
  Conversation & { messages: unknown[] }
> {

  return {
    id: id,
    title: 'Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0,
    retrievalMode: 'hybrid',
    messages: []
  };
}

export async function deleteConversation(
  _id: string
): Promise<void> {

  return;
}