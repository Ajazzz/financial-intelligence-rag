import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Brain } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import type { Message, RetrievalMode, DocumentCollection } from '../../types';

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  retrievalMode: RetrievalMode;
  collections: DocumentCollection[];
  onSend: (content: string, mode: RetrievalMode, collections: DocumentCollection[]) => void;
  onAbort: () => void;
  onSelectMessage: (m: Message) => void;
  selectedMessageId: string | null;
}

const STARTER_PROMPTS = [
  'What are the company’s primary revenue drivers?',
  'What risks could impact future business growth?',
  'What did management say about future AI demand?',
  'Summarize the long-term AI strategy from the documents.',
];

export function ChatPanel({
  messages,
  isStreaming,
  error,
  retrievalMode,
  collections,
  onSend,
  onAbort,
  onSelectMessage,
  selectedMessageId,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  function handleSubmit() {
    const q = input.trim();
    if (!q) return;
    setInput('');
    onSend(q, retrievalMode, collections);
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-emerald-400" />
          <span className="text-sm font-semibold text-slate-200">Financial Intelligence RAG</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Mode: <span className="text-emerald-400">{retrievalMode}</span>
          </span>
          <span className="text-xs font-mono text-slate-600">
            {collections.filter(c => c.active).length}/{collections.length} collections
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 min-h-0">
        {messages.length === 0 ? (
          <EmptyState onPrompt={p => { setInput(p); }} />
        ) : (
          messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              isStreaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
              onSelectMessage={onSelectMessage}
              selected={m.id === selectedMessageId}
            />
          ))
        )}

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded bg-red-500/5 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-800 shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onAbort={onAbort}
          isStreaming={isStreaming}
        />
        <p className="text-center text-[10px] font-mono text-slate-700 mt-2">
          Shift+Enter for newline · Enter to send
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-12">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Brain size={22} className="text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-slate-200 mb-1">Contract Intelligence AI</h2>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Enterprise retrieval system for industrial contracts, procurement agreements, and operational documents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 w-full max-w-md">
        {STARTER_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="px-4 py-3 text-left text-xs text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 hover:border-slate-600 hover:bg-slate-900 transition-colors leading-relaxed"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
