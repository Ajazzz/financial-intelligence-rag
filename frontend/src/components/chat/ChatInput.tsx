import { useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, onAbort, isStreaming, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) onSubmit();
    }
  }

  return (
    <div className="relative flex items-end gap-3 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus-within:border-emerald-500/50 transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled || isStreaming}
        placeholder="Ask about revenue drivers, business risks, AI strategy, earnings commentary, or financial performance…"
        rows={1}
        className="flex-1 bg-transparent resize-none text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none leading-relaxed disabled:opacity-50"
      />

      {isStreaming ? (
        <button
          onClick={onAbort}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
        >
          <Square size={11} />
          Stop
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isStreaming ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          Send
        </button>
      )}
    </div>
  );
}
