import {
  Search,
  Tag,
  Filter,
  GitBranch
} from 'lucide-react';

import { Badge } from '../ui/Badge';

import type {
  QueryAnalysis
} from '../../types';

interface QueryAnalysisPanelProps {
  analysis: QueryAnalysis;
}

export function QueryAnalysisPanel({
  analysis
}: QueryAnalysisPanelProps) {

  const entities =
    analysis?.entities ?? [];

  const filters =
    analysis?.filters ?? {};

  const expandedQueries =
    analysis?.expandedQueries ?? [];

  return (

    <div className="space-y-4 px-1">

      {/* Intent */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
          <Search size={9} />
          Intent
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 rounded px-3 py-2">
          {analysis?.intent ?? 'unknown'}
        </p>
      </div>

      {/* Entities */}
      {entities.length > 0 && (

        <div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Tag size={9} />
            Entities
          </div>

          <div className="flex flex-wrap gap-1.5">

            {entities.map((e, i) => (

              <Badge
                key={i}
                variant="amber"
                size="xs"
              >
                {e}
              </Badge>

            ))}

          </div>

        </div>
      )}

      {/* Filters */}
      {Object.keys(filters).length > 0 && (

        <div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Filter size={9} />
            Metadata Filters
          </div>

          <div className="space-y-1">

            {Object.entries(filters).map(
              ([k, v]) => (

                <div
                  key={k}
                  className="flex items-center gap-2 text-xs"
                >

                  <span className="font-mono text-slate-500">
                    {k}:
                  </span>

                  <Badge
                    variant="slate"
                    size="xs"
                  >
                    {String(v)}
                  </Badge>

                </div>
              )
            )}

          </div>

        </div>
      )}

      {/* Expanded Queries */}
      {expandedQueries.length > 0 && (

        <div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <GitBranch size={9} />
            Multi-Query Expansion
          </div>

          <ol className="space-y-1.5">

            {expandedQueries.map(
              (q, i) => (

                <li
                  key={i}
                  className="flex gap-2"
                >

                  <span className="shrink-0 text-[10px] font-mono text-slate-600 mt-0.5">
                    Q{i + 1}
                  </span>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {q}
                  </p>

                </li>
              )
            )}

          </ol>

        </div>
      )}

      {/* Strategy */}
      <div>

        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">
          Retrieval Strategy
        </div>

        <Badge
          variant="emerald"
          size="sm"
        >
          {analysis?.retrievalStrategy ?? 'hybrid'}
        </Badge>

      </div>

    </div>
  );
}