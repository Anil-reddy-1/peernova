import { useEffect, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(socketInstance);
  const [isConnected, setIsConnected] = useState(socketInstance?.connected || false);

  useEffect(() => {
    if (!user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (!socketInstance) {
      const getSocket = async () => {
        const token = await user.getIdToken();
        const url = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
        
        socketInstance = io(url, {
          auth: { token },
          reconnectionAttempts: 5,
        });

        socketInstance.on('connect', () => setIsConnected(true));
        socketInstance.on('disconnect', () => setIsConnected(false));
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(socketInstance);
      };

      getSocket();
    }

    return () => {
      // In many apps we keep the socket alive across components, 
      // but if we unmount the whole app we disconnect.
      // Usually we wouldn't disconnect here if it's a singleton hook.
    };
  }, [user]);

  return { socket, isConnected };
}
