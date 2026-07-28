'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { useWatchPartyChat } from '@/hooks/use-watch-party-chat';
import { Player } from '@/components/player';
import { Button } from '@/components/ui/button';
import type { WatchParty } from '@/lib/api/types';

export function WatchPartyRoom({
  party,
  title,
  src,
  profileId,
  movieId,
  episodeId,
}: {
  party: WatchParty;
  title: string;
  src: string | null;
  profileId: string;
  movieId?: string;
  episodeId?: string;
}) {
  const { messages, sendMessage, connected, onlineCount } = useWatchPartyChat(party.id);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    sendMessage(draft);
    setDraft('');
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="truncate text-xl font-bold text-white">{title}</h1>
          <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
            <span className="rounded bg-red-600/20 px-1.5 py-0.5 font-mono text-red-400">{party.code}</span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {onlineCount}
            </span>
          </span>
        </div>
        {src ? (
          <Player
            src={src}
            profileId={profileId}
            movieId={movieId}
            episodeId={episodeId}
            className="aspect-video w-full rounded-lg"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-white/5 text-white/50">
            Este contenido no tiene un video disponible.
          </div>
        )}
        <p className="mt-2 text-xs text-white/40">
          Cada participante controla su propia reproducción — todavía no se sincroniza automáticamente.
        </p>
      </div>

      <div className="flex h-[70vh] w-full flex-col rounded-lg border border-white/10 bg-white/[0.03] lg:h-[calc(100vh-140px)] lg:w-80 lg:shrink-0">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white">Chat</p>
          <p className="text-xs text-white/40">{connected ? 'Conectado' : 'Conectando…'}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <p className="text-sm text-white/40">Todavía no hay mensajes.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((message) => (
                <div key={message.id}>
                  <span className="text-xs font-semibold text-red-400">{message.userName}</span>{' '}
                  <span className="text-sm break-words text-white/85">{message.body}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/10 p-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribí un mensaje…"
            maxLength={500}
            className="h-9 flex-1 rounded-full bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-1 focus:ring-red-600"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim()}
            className="shrink-0 bg-red-600 text-white hover:bg-red-700"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
