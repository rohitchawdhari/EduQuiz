import { io } from 'socket.io-client';

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_SERVER_URL = rawSocketUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('eduquiz_token');
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
