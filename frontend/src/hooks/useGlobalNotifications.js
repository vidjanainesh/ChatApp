import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

let existingSocket = null; // <-- added to track global instance

export default function useGlobalNotifications(token, onNewMessageAlert) {
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    if (existingSocket) {
      console.log("Socket already exists, reusing:", existingSocket.id);
      socketRef.current = existingSocket;
      return;
    }

    socketRef.current = io(process.env.REACT_APP_API_BASE, {
      auth: { token },
    });

    existingSocket = socketRef.current;

    socketRef.current.on("connect", () => {
      console.log("Global socket connected:", socketRef.current.id);
    });

    socketRef.current.on("newMessage", ({message, fromUserId}) => {
      if (typeof onNewMessageAlert === "function") {
        onNewMessageAlert(fromUserId);
      }
      if (Notification.permission === "granted" && document.visibilityState !== "visible") {
        const notification = new Notification("New Message", {
          body: `${message.sender_name}: New Message`,
          icon: "/icon.png",
        });

        notification.onclick = () => {
          window.focus();
          navigate(`/chatbox/${message.sender_id}?name=${encodeURIComponent(message.sender_name)}`);
        };
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("Global socket disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        existingSocket = null; // reset on unmount
      }
    };
  }, [token, navigate]);

  return socketRef;
}