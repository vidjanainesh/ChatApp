import { useEffect, useState } from "react";
import { initSocket } from "./socketManager";
import { useNavigate } from "react-router-dom";

export default function useSocket({ token, chatUserId, groupId, loggedInUserId, setMessages, setIsTyping, onNewMessageAlert }) {
  const navigate = useNavigate();
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    setSocketInstance(socket);

    if (!socket) return;

    socket.off("connect");
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("newMessage", (data) => {
      const message = data?.message || data;
      const senderIdStr = String(message.sender_id);
      const receiverIdStr = String(message.receiver_id);
      const loggedInUserIdStr = String(loggedInUserId);

      // 1. Push to chat messages if it's the active conversation
      if (chatUserId && setMessages) {
        if (
          (senderIdStr === loggedInUserIdStr && receiverIdStr === chatUserId) ||
          (receiverIdStr === loggedInUserIdStr && senderIdStr === chatUserId)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      }

      // 2. Global notification logic
      if (
        typeof onNewMessageAlert === "function" &&
        senderIdStr !== loggedInUserIdStr
      ) {
        onNewMessageAlert(senderIdStr);
      }

      // 3. Push browser notification
      if (
        Notification.permission === "granted" &&
        document.visibilityState !== "visible" &&
        senderIdStr !== loggedInUserIdStr
      ) {
        const notif = new Notification("New Message", {
          body: `${message.sender_name}: New Message`,
          icon: "/icon.png",
        });

        notif.onclick = () => {
          window.focus();
          navigate(`/chatbox/${message.sender_id}?name=${encodeURIComponent(message.sender_name || "User")}`);
        };
      }
    });

    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      if (setIsTyping && senderId === parseInt(chatUserId) && receiverId === loggedInUserId) {
        setIsTyping(isTyping);
      }
    });

    // New: Handle newGroupMessage
    socket.on("newGroupMessage", (data) => {
      const { message, groupId: msgGroupId } = data;

      if (groupId && parseInt(groupId) === msgGroupId && setMessages) {
        setMessages((prev) => [...prev, message]);
      }

      if (typeof onNewMessageAlert === "function") {
        onNewMessageAlert(`group_${msgGroupId}`);
      }

      if (
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        const notif = new Notification("New Group Message", {
          body: `${message.sender_name}: ${message.message}`,
          icon: "/icon.png",
        });

        notif.onclick = () => {
          window.focus();
          navigate(`/groupchat/${msgGroupId}`);
        };
      }
    });

    // New: Handle groupTyping
    socket.on("groupTyping", ({ groupId: typingGroupId, senderId }) => {
      if (
        setIsTyping &&
        typingGroupId === parseInt(groupId) &&
        senderId !== loggedInUserId
      ) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      // Detach only listeners, not socket itself
      socket.off("newMessage");
      socket.off("typing");
      socket.off("newGroupMessage");
      socket.off("groupTyping");
    };
  }, [token, chatUserId, loggedInUserId, onNewMessageAlert]);

  return socketInstance;
}