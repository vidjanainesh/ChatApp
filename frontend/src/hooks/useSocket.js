import { useEffect, useState } from "react";
import { initSocket } from "./socketManager";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, addGroupMessage } from "../store/chatSlice";
import { addFriend, setGroups, appendUnreadPrivate, appendUnreadGroup, setFriendReqCount } from "../store/userSlice";

export default function useSocket({ token, chatUserId, groupId, loggedInUserId, setMessages, setIsTyping, onNewMessageAlert }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [socketInstance, setSocketInstance] = useState(null);
  const friendReqCount = useSelector((state) => state.user.friendReqCount);

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    setSocketInstance(socket);

    if (!socket) return;

    socket.off("connect");
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on('friendReqSent', () => {
      dispatch(setFriendReqCount(friendReqCount+1));
    })

    socket.on("friendAccepted", (data) => {
      const {friend} = data;
      if(friend) {
        dispatch(addFriend(friend));
        if (Notification.permission === "granted") {
          const notif = new Notification("Friend Request Accepted", {
            body: `${friend.name} accepted your request!`,
            icon: "/icon.png",
          });

          notif.onclick = () => {
            window.focus();
            navigate("/dashboard");
          };
        }
      }
    });

    socket.on("groupCreated", (data) => {
      console.log("NEW GROUP!!!!!!!!!!!!!!!");
      const {group} = data;
      if(group) {
        dispatch(setGroups(group));
        socket.emit('joinGroupRoom',`group_${group.id}`)
        if (Notification.permission === "granted") {
          const notif = new Notification("Group Joined", {
            body: `You are part of a new group: ${group.name}!`,
            icon: "/icon.png",
          });

          notif.onclick = () => {
            window.focus();
            navigate("/dashboard");
          };
        }
      }
    })

    socket.on("newMessage", (data) => {
      const message = data?.message || data;
      const senderIdStr = String(message.sender_id);
      const receiverIdStr = String(message.receiver_id);
      const loggedInUserIdStr = String(loggedInUserId);

      // 1. Push to chat messages if it's the active conversation
      if (chatUserId) {
        if (
          (senderIdStr === loggedInUserIdStr && receiverIdStr === chatUserId) ||
          (receiverIdStr === loggedInUserIdStr && senderIdStr === chatUserId)
        ) {
          // setMessages((prev) => [...prev, message]);
          dispatch(addMessage(message)); 
        }
      }

      // 2. Global notification logic
      if (senderIdStr !== loggedInUserIdStr) {
        // onNewMessageAlert(senderIdStr);
        dispatch(appendUnreadPrivate(senderIdStr));
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

      if (groupId && parseInt(groupId) === parseInt(msgGroupId) && setMessages) {
        // setMessages((prev) => [...prev, message]);
        dispatch(addGroupMessage(message));
      }

      dispatch(appendUnreadGroup(msgGroupId));

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
      socket.off("friendAccepted");
      socket.off("groupCreated")
      socket.off("newMessage");
      socket.off("typing");
      socket.off("newGroupMessage");
      socket.off("groupTyping");
    };
  }, [token, chatUserId, groupId, loggedInUserId, onNewMessageAlert, dispatch, navigate, setIsTyping, setMessages, friendReqCount]);s

  return socketInstance;
}