import { io } from "socket.io-client";

let socket = null;

export function initSocket(token) {
  if (!token) return null;

  if (!socket) {
    socket = io(process.env.REACT_APP_API_BASE, {
      auth: { token },
    });
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
