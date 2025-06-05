import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export default function useSocket({ id, token, loggedInUserId, setMessages, setIsTyping }) {
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(process.env.REACT_APP_API_BASE, {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("newMessage", (newMessage) => {
      const receiverIdStr = String(newMessage.receiver_id);
      const senderIdStr = String(newMessage.sender_id);

      if (
        (senderIdStr === String(loggedInUserId) && receiverIdStr === id) ||
        (receiverIdStr === String(loggedInUserId) && senderIdStr === id)
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }

      if (
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        const notification = new Notification("New Message", {
          body: `${newMessage.sender_name}: ${newMessage.message}`,
          icon: "/icon.png",
        });

        notification.onclick = () => {
          window.focus();
          navigate(`/chatbox/${newMessage.sender_id}?name=${encodeURIComponent(newMessage.sender_name)}`);
        };
      }
    });

    socketRef.current.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    socketRef.current.on("typing", ({ senderId, receiverId, isTyping }) => {
      if (senderId === parseInt(id) && receiverId === loggedInUserId) {
        setIsTyping(isTyping);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id, token, loggedInUserId]);

  return socketRef;
}