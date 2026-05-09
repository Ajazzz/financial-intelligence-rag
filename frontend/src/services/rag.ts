import request from './api';
import type { DocumentCollection } from '../types';

export interface RagStatus {
  pineconeConnected: boolean;
  cohereConnected: boolean;
  groqConnected: boolean;
  redisConnected: boolean;
  totalDocuments: number;
  totalChunks: number;
  embeddingModel: string;
  rerankModel: string;
  llmModel: string;
  chunkingStrategy: string;
}

export async function getRagStatus(): Promise<RagStatus> {
  return request<RagStatus>('/api/rag/status');
}

export async function listCollections(): Promise<DocumentCollection[]> {
  return request<DocumentCollection[]>('/api/rag/collections');
}

export async function getCollectionStats(collectionId: string): Promise<{
  documentCount: number;
  chunkCount: number;
  lastIndexed: string;
}> {
  return request(`/api/rag/collections/${collectionId}/stats`);
}
