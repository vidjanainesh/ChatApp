import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

export default function useGlobalNotifications(token) {
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(process.env.REACT_APP_API_BASE, {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("Global socket connected:", socketRef.current.id);
    });

    socketRef.current.on("newMessage", (message) => {
      if (Notification.permission === "granted" && document.visibilityState !== "visible") {
        const notification = new Notification("New Message", {
          // body: `${message.sender_name}: ${message.message}`,
          body: 'New Message',
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
      }
    };
  }, [token, navigate]);

  return socketRef;
}