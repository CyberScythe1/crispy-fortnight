import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';

export interface SocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  connect: (docId: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const token = localStorage.getItem('accessToken');
  const rawWsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4003';
  const baseWsUrl = rawWsUrl.replace(/^http/, 'ws');

  const connect = useCallback(
    (docId: string) => {
      if (socket?.readyState === WebSocket.OPEN) return;
      const url = `${baseWsUrl}/yjs?docId=${encodeURIComponent(docId)}${token ? `&token=${token}` : ''}`;
      const ws = new WebSocket(url);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setSocket(null);
      };
      ws.onerror = () => setConnected(false);
      setSocket(ws);
    },
    [socket, token, baseWsUrl],
  );

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) socket.close();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
}