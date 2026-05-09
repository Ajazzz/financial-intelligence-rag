import { Bot, User, Clock, Cpu, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onSelectMessage?: (m: Message) => void;
  selected?: boolean;
}

export function MessageBubble({
  message,
  isStreaming,
  onSelectMessage,
  selected
}: MessageBubbleProps) {

  const isUser = message.role === 'user';

  const meta = message.metadata;

  const isEmpty =
    !isStreaming &&
    message.content === '' &&
    message.role === 'assistant';

  return (
    <div
      className={`group flex gap-3 px-1 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
      onClick={() =>
        !isUser && onSelectMessage?.(message)
      }
    >

      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded flex items-center justify-center mt-0.5 ${
          isUser
            ? 'bg-slate-700'
            : 'bg-emerald-500/15 border border-emerald-500/25'
        }`}
      >
        {isUser ? (
          <User
            size={13}
            className="text-slate-300"
          />
        ) : (
          <Bot
            size={13}
            className="text-emerald-400"
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`flex flex-col gap-1.5 max-w-[78%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >

        <div
          className={`rounded-lg px-4 py-3 text-sm leading-relaxed transition-colors cursor-pointer ${
            isUser
              ? 'bg-slate-700 text-slate-100'
              : selected
              ? 'bg-slate-800 border border-emerald-500/30 text-slate-100'
              : 'bg-slate-900 border border-slate-800 text-slate-100 hover:border-slate-700'
          }`}
        >

          {isEmpty ? (

            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle size={13} />
              Failed to retrieve a response. Check backend connectivity.
            </div>

          ) : message.content === '' && isStreaming ? (

            <div className="space-y-2">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-3 w-40" />
            </div>

          ) : (

            <p className="whitespace-pre-wrap">
              {message.content}
            </p>

          )}

          {/* Streaming cursor */}
          {isStreaming && message.content !== '' && (
            <span className="inline-block w-1 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
          )}

        </div>

        {/* Metadata row */}
        {!isUser && meta && !isStreaming && (

          <div className="flex flex-wrap items-center gap-2 px-1">

            {meta.latencyMs !== undefined && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
                <Clock size={9} />
                {meta.latencyMs}ms
              </span>
            )}

            {meta.tokensUsed !== undefined && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
                <Cpu size={9} />
                {meta.tokensUsed} tok
              </span>
            )}

            {meta.sourceCount !== undefined &&
              meta.sourceCount > 0 && (
                <Badge variant="emerald" size="xs">
                  {meta.sourceCount} sources
                </Badge>
            )}

            {meta.retrievalMode && (
              <Badge variant="blue" size="xs">
                {meta.retrievalMode}
              </Badge>
            )}

          </div>

        )}

      </div>

    </div>
  );
}