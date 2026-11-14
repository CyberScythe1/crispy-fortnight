import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_WS_URL || 'http://localhost:4003', { autoConnect: true, transports: ['websocket', 'polling'] });
    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));
    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, []);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export function useSocket() { const context = useContext(SocketContext); if (!context) throw new Error('useSocket must be used within a SocketProvider'); return context; }