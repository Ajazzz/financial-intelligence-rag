export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  latencyMs?: number;
  tokensUsed?: number;
  retrievalMode?: RetrievalMode;
  sourceCount?: number;
  confidenceScore?: number;
  sources?: SourceChunk[];
  queryAnalysis?: QueryAnalysis;
  retrievalDebug?: RetrievalDebug;
}

export interface SourceChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber?: number;
  section?: string;
  similarityScore: number;
  rerankScore?: number;
  chunkType: 'parent' | 'child' | 'standalone';
  metadata: Record<string, string>;
  citations: Citation[];
}

export interface Citation {
  id: string;
  text: string;
  location: string;
  confidence: number;
}

export interface QueryAnalysis {
  intent: string;
  entities: string[];
  filters: Record<string, string>;
  expandedQueries: string[];
  retrievalStrategy: string;
}

export interface RetrievalDebug {
  hybridSearchUsed: boolean;
  bm25Hits: number;
  denseHits: number;
  rerankingApplied: boolean;
  contextCompressed: boolean;
  totalChunksRetrieved: number;
  finalChunksUsed: number;
  retrievalTimeMs: number;
  embeddingModel: string;
  rerankModel: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  retrievalMode: RetrievalMode;
}

export type RetrievalMode = 'hybrid' | 'dense' | 'sparse' | 'rerank';

export interface DocumentCollection {
  id: string;
  name: string;
  documentCount: number;
  active: boolean;
  type: 'contracts' | 'procurement' | 'escalation' | 'operational';
}

export interface ChatRequest {
  query: string;
  conversationId: string;
  retrievalMode: RetrievalMode;
  collectionIds: string[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
  queryAnalysis: QueryAnalysis;
  retrievalDebug: RetrievalDebug;
  latencyMs: number;
  tokensUsed: number;
  confidenceScore: number;
}
