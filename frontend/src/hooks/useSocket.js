import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(onNewMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(process.env.REACT_APP_API_BASE, {
        reconnectionAttempts: 3,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected:', socketRef.current.id);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
      });

      socketRef.current.on('newMessage', (message) => {
        console.log('📩 New message received:', message);
        onNewMessage(message);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.warn('⚠️ Socket disconnected:', reason);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [onNewMessage]);

  return socketRef;
}