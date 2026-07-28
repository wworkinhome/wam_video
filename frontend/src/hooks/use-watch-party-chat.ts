'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { clientFetch } from '@/lib/api/client';
import type { WatchPartyMessage } from '@/lib/api/types';

interface HistoryMessage {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { id: string; name: string | null };
}

interface Presence {
  type: 'joined' | 'left';
  userId: string;
  name: string;
}

const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

// Chat en vivo del watch party: carga el historial por REST (vía el proxy /api/backend,
// autenticado con cookie httpOnly) y después se conecta directo por WebSocket al backend
// para mensajes/presencia en tiempo real — necesita un JWT de corta vida propio para el
// handshake, que pide a /api/ws-token (ver ese route handler para el porqué).
export function useWatchPartyChat(partyId: string) {
  const [messages, setMessages] = useState<WatchPartyMessage[]>([]);
  const [online, setOnline] = useState<Map<string, string>>(new Map());
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | undefined;

    async function connect() {
      const history = await clientFetch<HistoryMessage[]>(`/watch-parties/${partyId}/messages`).catch(() => []);
      if (cancelled) return;
      setMessages(history.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, userId: m.userId, userName: m.user.name ?? '—' })));

      const tokenRes = await fetch('/api/ws-token');
      if (!tokenRes.ok || cancelled) return;
      const { token } = await tokenRes.json();

      socket = io(`${BACKEND_WS_URL}/watch-party`, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket?.emit('join', { partyId });
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on('message', (message: WatchPartyMessage) => {
        setMessages((prev) => [...prev, message]);
      });
      socket.on('presence', (event: Presence) => {
        setOnline((prev) => {
          const next = new Map(prev);
          if (event.type === 'joined') next.set(event.userId, event.name);
          else next.delete(event.userId);
          return next;
        });
      });
    }

    connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [partyId]);

  const sendMessage = useCallback((body: string) => {
    if (!body.trim()) return;
    socketRef.current?.emit('message', { body: body.trim() });
  }, []);

  return { messages, sendMessage, connected, onlineCount: online.size };
}
