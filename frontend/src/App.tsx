import { useState, useCallback, useEffect } from 'react';

import { Sidebar } from './components/sidebar/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { SourceInspector } from './components/inspector/SourceInspector';

import { useChat } from './hooks/useChat';
import { useConversations } from './hooks/useConversations';
import { useRagStatus } from './hooks/useRagStatus';

import type {
  Message,
  RetrievalMode,
  DocumentCollection
} from './types';

export default function App() {

  const {
    conversations,
    active,
    setActive,
    createNew,
    remove,
    updateTitle
  } = useConversations();

  const {
    status: ragStatus,
    collections: ragCollections,
    loading: ragLoading
  } = useRagStatus();

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    abort,
    clearMessages
  } = useChat(active.id);

  const [retrievalMode, setRetrievalMode] =
    useState<RetrievalMode>('hybrid');

  const [collections, setCollections] =
    useState<DocumentCollection[]>([]);

  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);

  // ─────────────────────────────────────────
  // SYNC COLLECTIONS
  // ─────────────────────────────────────────
  useEffect(() => {

    if (ragCollections.length > 0) {
      setCollections(ragCollections);
    }

  }, [ragCollections]);

  // ─────────────────────────────────────────
  // AUTO-SELECT LATEST ASSISTANT MESSAGE
  // ─────────────────────────────────────────
  useEffect(() => {

    if (messages.length === 0) return;

    const latestAssistantMessage =
      [...messages]
        .reverse()
        .find(m => m.role === 'assistant');

    if (
      latestAssistantMessage &&
      latestAssistantMessage.content !== ''
    ) {
      setSelectedMessage(latestAssistantMessage);
    }

  }, [messages]);

  // ─────────────────────────────────────────
  // COLLECTION TOGGLE
  // ─────────────────────────────────────────
  const handleCollectionToggle =
    useCallback((id: string) => {

      setCollections(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, active: !c.active }
            : c
        )
      );

    }, []);

  // ─────────────────────────────────────────
  // NEW CONVERSATION
  // ─────────────────────────────────────────
  const handleNew = useCallback(() => {

    const c = createNew();

    clearMessages();

    setSelectedMessage(null);

    void c;

  }, [createNew, clearMessages]);

  // ─────────────────────────────────────────
  // SELECT CONVERSATION
  // ─────────────────────────────────────────
  const handleSelectConversation =
    useCallback((c: typeof active) => {

      setActive(c);

      clearMessages();

      setSelectedMessage(null);

    }, [setActive, clearMessages]);

  // ─────────────────────────────────────────
  // SEND MESSAGE
  // ─────────────────────────────────────────
  const handleSend = useCallback(

    (
      content: string,
      mode: RetrievalMode,
      cols: DocumentCollection[]
    ) => {

      // Auto-title first message
      if (messages.length === 0) {

        updateTitle(
          active.id,
          content.slice(0, 50) +
          (content.length > 50 ? '…' : '')
        );

      }

      sendMessage(content, mode, cols);

    },

    [
      messages.length,
      active.id,
      updateTitle,
      sendMessage
    ]

  );

  const activeCollections =
    collections.length > 0
      ? collections
      : ragCollections;

  return (

    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">

      <Sidebar
        conversations={conversations}
        active={active}
        onSelect={handleSelectConversation}
        onNew={handleNew}
        onDelete={remove}
        retrievalMode={retrievalMode}
        onRetrievalModeChange={setRetrievalMode}
        collections={activeCollections}
        onCollectionToggle={handleCollectionToggle}
        ragStatus={ragStatus}
        ragLoading={ragLoading}
      />

      <main className="flex flex-1 min-w-0 min-h-0">

        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          retrievalMode={retrievalMode}
          collections={activeCollections}
          onSend={handleSend}
          onAbort={abort}
          onSelectMessage={setSelectedMessage}
          selectedMessageId={selectedMessage?.id ?? null}
        />

        <SourceInspector
          selectedMessage={selectedMessage}
          isStreaming={isStreaming}
        />

      </main>

    </div>

  );
}