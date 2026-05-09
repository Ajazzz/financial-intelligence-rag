import { useState } from 'react';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  Trash2,
  Layers,
  Database,
  Zap,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import type { Conversation, RetrievalMode, DocumentCollection } from '../../types';
import type { RagStatus } from '../../services/rag';

interface SidebarProps {
  conversations: Conversation[];
  active: Conversation;
  onSelect: (c: Conversation) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  retrievalMode: RetrievalMode;
  onRetrievalModeChange: (m: RetrievalMode) => void;
  collections: DocumentCollection[];
  onCollectionToggle: (id: string) => void;
  ragStatus: RagStatus | null;
  ragLoading: boolean;
}

const MODES: { value: RetrievalMode; label: string; desc: string }[] = [
  { value: 'hybrid', label: 'Hybrid', desc: 'BM25 + Dense' },
  { value: 'dense', label: 'Dense', desc: 'Semantic only' },
  { value: 'sparse', label: 'Sparse', desc: 'BM25 only' },
  { value: 'rerank', label: 'Rerank', desc: 'Cohere rerank' },
];

export function Sidebar({
  conversations,
  active,
  onSelect,
  onNew,
  onDelete,
  retrievalMode,
  onRetrievalModeChange,
  collections,
  onCollectionToggle,
  ragStatus,
  ragLoading,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-4 gap-4 border-r border-slate-800 bg-slate-950">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <div className="w-px h-px" />
        <Brain size={18} className="text-emerald-400" />
      </div>
    );
  }

  return (
    <aside className="w-64 flex flex-col border-r border-slate-800 bg-slate-950 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Brain size={20} className="text-emerald-400" />
          <div>
            <div className="text-sm font-semibold text-slate-100 leading-tight">Financial Intelligence RAG</div>
            <div className="text-[10px] font-mono text-emerald-500 tracking-wider uppercase">AI · Enterprise</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 py-3 border-b border-slate-800">
        <button
          onClick={onNew}
          className="flex items-center gap-2 w-full px-3 py-2 rounded border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-300 hover:text-emerald-400 text-xs font-medium transition-all"
        >
          <Plus size={13} />
          New Session
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-3 pt-3 pb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Sessions</span>
        </div>
        {conversations.length === 0 ? (
          <div className="px-4 py-3 text-xs text-slate-600">No sessions yet</div>
        ) : (
          <ul className="px-2 pb-2 space-y-0.5">
            {conversations.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c)}
                  className={`group flex items-start justify-between w-full px-2.5 py-2 rounded text-left transition-colors ${
                    active.id === c.id
                      ? 'bg-slate-800 text-slate-100'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare size={12} className="shrink-0 mt-0.5" />
                    <span className="text-xs truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Retrieval Mode */}
        <div className="px-3 pt-4 pb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Filter size={9} /> Retrieval Mode
          </span>
        </div>
        <div className="px-3 pb-3 space-y-1">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => onRetrievalModeChange(m.value)}
              className={`flex items-center justify-between w-full px-2.5 py-2 rounded text-xs transition-colors ${
                retrievalMode === m.value
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span className="font-medium">{m.label}</span>
              <span className={`text-[10px] font-mono ${retrievalMode === m.value ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                {m.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Collections */}
        <div className="px-3 pt-2 pb-1 border-t border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Database size={9} /> Document Collections
          </span>
        </div>
        <div className="px-3 pb-3 space-y-1">
          {ragLoading ? (
            <>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </>
          ) : collections.length === 0 ? (
            <p className="text-xs text-slate-600 px-1">No collections found</p>
          ) : (
            collections.map(col => (
              <button
                key={col.id}
                onClick={() => onCollectionToggle(col.id)}
                className={`flex items-center justify-between w-full px-2.5 py-2 rounded text-xs transition-colors ${
                  col.active
                    ? 'bg-slate-800 text-slate-200'
                    : 'hover:bg-slate-900 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.active ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                  <span className="truncate">{col.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-600">{col.documentCount}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="border-t border-slate-800 px-3 py-3 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-2">
          <Zap size={9} /> System
        </div>
        {ragLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : ragStatus ? (
          <div className="space-y-1.5">
            <StatusDot online={ragStatus.pineconeConnected} label="Pinecone" />
            <StatusDot online={ragStatus.cohereConnected} label="Cohere" />
            <StatusDot online={ragStatus.groqConnected} label="Groq" />
            <StatusDot online={ragStatus.redisConnected} label="Redis" />
            <div className="pt-1 border-t border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5">
                <Layers size={9} className="text-slate-600" />
                <span className="text-[10px] font-mono text-slate-500">
                  {ragStatus.chunkingStrategy}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw size={9} className="text-slate-600" />
                <span className="text-[10px] font-mono text-slate-500">
                  Rerank: {ragStatus.rerankModel}
                </span>
              </div>
              <Badge variant="emerald" size="xs">{ragStatus.llmModel}</Badge>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-red-400 font-mono">Backend offline</p>
        )}
      </div>
    </aside>
  );
}
