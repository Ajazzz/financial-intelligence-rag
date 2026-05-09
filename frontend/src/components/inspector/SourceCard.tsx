import { FileText, Hash } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ScoreBar } from '../ui/ScoreBar';
import type { SourceChunk } from '../../types';

interface SourceCardProps {
  chunk: SourceChunk;
  index: number;
}

export function SourceCard({ chunk, index }: SourceCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-4 h-4 rounded bg-slate-800 flex items-center justify-center text-[9px] font-mono text-slate-500">
            {index + 1}
          </span>
          <FileText size={11} className="text-slate-500 shrink-0" />
          <span className="text-xs font-medium text-slate-200 truncate">{chunk.documentTitle}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={chunk.chunkType === 'parent' ? 'blue' : 'slate'} size="xs">
            {chunk.chunkType}
          </Badge>
          {chunk.pageNumber !== undefined && (
            <span className="text-[10px] font-mono text-slate-600">p.{chunk.pageNumber}</span>
          )}
        </div>
      </div>

      {/* Snippet */}
      <div className="px-3 py-2.5">
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
          {chunk.content}
        </p>
      </div>

      {/* Scores */}
      <div className="px-3 py-2.5 border-t border-slate-800 space-y-2">
        <ScoreBar score={chunk.similarityScore} label="Similarity" colorClass="bg-emerald-500" />
        {chunk.rerankScore !== undefined && (
          <ScoreBar score={chunk.rerankScore} label="Rerank" colorClass="bg-blue-500" />
        )}
      </div>

      {/* Metadata */}
      {Object.keys(chunk.metadata).length > 0 && (
        <div className="px-3 py-2 border-t border-slate-800 flex flex-wrap gap-1.5">
          {Object.entries(chunk.metadata).slice(0, 4).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
              <Hash size={8} />
              <span className="text-slate-500">{k}:</span>
              <span className="text-slate-400">{v}</span>
            </span>
          ))}
        </div>
      )}

      {/* Citations */}
      {chunk.citations.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-800 space-y-1">
          {chunk.citations.map(cit => (
            <div key={cit.id} className="flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5 w-3 h-3 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[8px] font-mono text-emerald-400">
                {cit.id}
              </span>
              <span className="text-[10px] text-slate-500 leading-relaxed">{cit.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
