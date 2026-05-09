import { Activity, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ScoreBar } from '../ui/ScoreBar';
import type { RetrievalDebug } from '../../types';

interface RetrievalDebugPanelProps {
  debug: RetrievalDebug;
}

export function RetrievalDebugPanel({ debug }: RetrievalDebugPanelProps) {
  const compressionRatio = debug.totalChunksRetrieved > 0
    ? debug.finalChunksUsed / debug.totalChunksRetrieved
    : 0;

  return (
    <div className="space-y-4 px-1">
      {/* Pipeline status */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Pipeline</div>
        <div className="space-y-1.5">
          <PipelineRow label="Hybrid Search" active={debug.hybridSearchUsed} />
          <PipelineRow label="BM25 Retrieval" active={debug.bm25Hits > 0} value={`${debug.bm25Hits} hits`} />
          <PipelineRow label="Dense Retrieval" active={debug.denseHits > 0} value={`${debug.denseHits} hits`} />
          <PipelineRow label="Cohere Reranking" active={debug.rerankingApplied} />
          <PipelineRow label="Context Compression" active={debug.contextCompressed} />
        </div>
      </div>

      {/* Chunk stats */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Chunk Stats</div>
        <div className="grid grid-cols-2 gap-2">
          <StatBlock label="Retrieved" value={debug.totalChunksRetrieved} />
          <StatBlock label="Used" value={debug.finalChunksUsed} highlight />
          <StatBlock label="Retrieval" value={`${debug.retrievalTimeMs}ms`} />
        </div>
        <div className="mt-3">
          <ScoreBar
            score={compressionRatio}
            label="Compression ratio"
            colorClass="bg-amber-500"
          />
        </div>
      </div>

      {/* Models */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Models</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Embedding</span>
            <Badge variant="slate" size="xs">{debug.embeddingModel}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Reranker</span>
            <Badge variant="blue" size="xs">{debug.rerankModel}</Badge>
          </div>
        </div>
      </div>

      {/* Activity indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Activity size={10} />
        <span className="font-mono">Retrieval completed in {debug.retrievalTimeMs}ms</span>
      </div>
    </div>
  );
}

function PipelineRow({ label, active, value }: { label: string; active: boolean; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {active ? (
          <CheckCircle size={11} className="text-emerald-400 shrink-0" />
        ) : (
          <XCircle size={11} className="text-slate-700 shrink-0" />
        )}
        <span className={`text-xs ${active ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
      </div>
      {value && <span className="text-[10px] font-mono text-slate-500">{value}</span>}
    </div>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`px-2.5 py-2 rounded border ${highlight ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 bg-slate-900'}`}>
      <div className={`text-base font-mono font-semibold ${highlight ? 'text-emerald-400' : 'text-slate-300'}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
    </div>
  );
}
