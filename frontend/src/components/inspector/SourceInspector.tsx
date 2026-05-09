import { useState } from 'react';
import { ChevronRight, ChevronLeft, PanelRight, Info } from 'lucide-react';
import { SourceCard } from './SourceCard';
import { RetrievalDebugPanel } from './RetrievalDebugPanel';
import { QueryAnalysisPanel } from './QueryAnalysisPanel';
import { Skeleton } from '../ui/Skeleton';
import type { Message } from '../../types';

interface SourceInspectorProps {
  selectedMessage: Message | null;
  isStreaming: boolean;
}

type Tab = 'sources' | 'debug' | 'analysis';

export function SourceInspector({ selectedMessage, isStreaming }: SourceInspectorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<Tab>('sources');

  const meta = selectedMessage?.metadata;
  const sources = meta?.sources ?? [];
  const debug = meta?.retrievalDebug;
  const analysis = meta?.queryAnalysis;

  if (collapsed) {
    return (
      <div className="w-10 flex flex-col items-center py-4 gap-3 border-l border-slate-800 bg-slate-950">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <PanelRight size={14} className="text-slate-600" />
      </div>
    );
  }

  return (
    <aside className="w-80 flex flex-col border-l border-slate-800 bg-slate-950 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <PanelRight size={13} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-200">Source Inspector</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 shrink-0">
        {(['sources', 'debug', 'analysis'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              tab === t
                ? 'text-emerald-400 border-b border-emerald-500'
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {t === 'sources' ? 'Sources' : t === 'debug' ? 'Retrieval Debug' : 'Query Analysis'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {isStreaming ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !selectedMessage ? (
          <EmptyInspector />
        ) : tab === 'sources' ? (
          sources.length === 0 ? (
            <p className="text-xs text-slate-600 px-1">No sources retrieved.</p>
          ) : (
            <div className="space-y-3">
              {sources.map((s, i) => (
                <SourceCard key={s.id} chunk={s} index={i} />
              ))}
            </div>
          )
        ) : tab === 'debug' ? (
          debug ? (
            <RetrievalDebugPanel debug={debug} />
          ) : (
            <p className="text-xs text-slate-600 px-1">No debug info available.</p>
          )
        ) : analysis ? (
          <QueryAnalysisPanel analysis={analysis} />
        ) : (
          <p className="text-xs text-slate-600 px-1">No query analysis available.</p>
        )}
      </div>
    </aside>
  );
}

function EmptyInspector() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
      <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
        <Info size={14} className="text-slate-600" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">No message selected</p>
        <p className="text-[10px] text-slate-700 mt-1 leading-relaxed max-w-[14rem]">
          Click an assistant response to inspect retrieved sources and retrieval metadata.
        </p>
      </div>
    </div>
  );
}
