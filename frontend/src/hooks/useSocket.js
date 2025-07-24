import { useEffect, useState } from "react";
import { initSocket } from "./socketManager";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, addGroupMessage, markMessagesAsSeen, markGroupMessagesAsSeen } from "../store/chatSlice";
import { addFriend, addGroup, appendUnreadPrivate, appendUnreadGroup, incrementFriendReqCount } from "../store/userSlice";
import { deletePrivateMessage, editPrivateMessage, deleteGroupMsgAction, editGroupMsgAction, addReactionToPrivateMessage, removeReactionFromPrivateMessage, addReactionToGroupMessage, removeReactionFromGroupMessage } from "../store/chatSlice";

export default function useSocket({ token, chatUserId, groupId, loggedInUserId, setIsTyping }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [socketInstance, setSocketInstance] = useState(null);
  const groups = useSelector(state => state.user.groups);
  const chatType = useSelector(state => state.chat.chatType);

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    setSocketInstance(socket);

    if (!socket) return;

    socket.off("connect");
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on('newFriendReqSent', () => {
      dispatch(incrementFriendReqCount());
    })

    socket.on("friendAccepted", (data) => {
      const { friend } = data;
      if (friend) {
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

    // socket.on('unFriend', (data) => {
    //   const {friendId} = data;
    //   if(friendId) {
    //     dispatch(removeFriend(friendId));
    //   }
    // })

    socket.on('messageReaction', (data) => {
      const { reactionObj } = data;
      if (reactionObj.targetType === 'private') {
        dispatch(addReactionToPrivateMessage({
          messageId: reactionObj.messageId,
          reaction: reactionObj,
        }));
      }
      if (reactionObj.targetType === 'group') {
        dispatch(addReactionToGroupMessage({
          messageId: reactionObj.messageId,
          reaction: reactionObj,
        }));
      }
    });

    socket.on('messageReactionRemoved', ({ messageId, userId }) => {
      if (chatType === 'private') {
        dispatch(removeReactionFromPrivateMessage({ messageId, userId }));
      } else if (chatType === 'group') {
        dispatch(removeReactionFromGroupMessage({ messageId, userId }));
      }
    });

    socket.on("newMessage", (data) => {
      const message = data?.message || data;
      const senderIdStr = String(message.senderId);
      const receiverIdStr = String(message.receiverId);
      const loggedInUserIdStr = String(loggedInUserId);

      // Ignore messages from self - because temp msg already being displayed 
      if (senderIdStr === loggedInUserIdStr) return;

      // 1. Push to chat messages if it's the active conversation
      if (chatUserId) {
        if (
          (senderIdStr === loggedInUserIdStr && receiverIdStr === chatUserId) ||
          (receiverIdStr === loggedInUserIdStr && senderIdStr === chatUserId)
        ) {
          dispatch(addMessage(message));
        }
      }

      // 2. Global notification logic
      if (senderIdStr !== loggedInUserIdStr) {
        dispatch(appendUnreadPrivate(senderIdStr));
      }

      // 3. Push browser notification
      if (
        Notification.permission === "granted" &&
        document.visibilityState !== "visible" &&
        senderIdStr !== loggedInUserIdStr
      ) {
        const notif = new Notification(`ChatApp - ${message.senderName?.split(' ')[0]}`, {
          body: `New message`,
          icon: "/icon.png",
        });

        notif.onclick = () => {
          window.focus();
          navigate(`/chatbox/${message.senderId}?name=${encodeURIComponent(message.senderName || "User")}`);
        };
      }
    });

    socket.on("messages-seen", ({ by, chatUserId, messageIds }) => {
      dispatch(markMessagesAsSeen({ userId: by, chatUserId, messageIds }));
    });

    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      // console.log("senderId: ", senderId, "receiverId: ", receiverId, "isTyping: ", isTyping);
      if (setIsTyping && senderId === parseInt(chatUserId) && receiverId === loggedInUserId) {
        setIsTyping(isTyping);
      }
    });

    socket.on('deleteMessage', (message) => {
      dispatch(deletePrivateMessage(message));
    })

    socket.on('editMessage', (message) => {
      dispatch(editPrivateMessage(message));
    })

    // New Group Created
    socket.on("groupCreated", (data) => {
      const { group } = data;
      if (group) {
        dispatch(addGroup(group));
        socket.emit('joinGroupRoom', `group_${group.id}`)
        if (Notification.permission === "granted") {
          const notif = new Notification("Group Joined", {
            body: `New group created: ${group.name}!`,
            icon: "/icon.png",
          });

          notif.onclick = () => {
            window.focus();
            navigate("/dashboard");
          };
        }
      }
    });

    // Group invitation
    socket.on("groupJoined", (data) => {
      const { group } = data;
      if (group) {
        const alreadyPresent = groups.some((g) => g.id === group.id);
        if (!alreadyPresent) {
          dispatch(addGroup(group));
          socket.emit("joinGroupRoom", `group_${group.id}`);

          if (Notification.permission === "granted") {
            const notif = new Notification("Group Joined", {
              body: `You are invited to join: ${group.name}!`,
              icon: "/icon.png",
            });

            notif.onclick = () => {
              window.focus();
              navigate("/dashboard");
            };
          }
        }
      }
    });

    // New: Handle newGroupMessage
    socket.on("newGroupMessage", (data) => {
      const { message, groupId: msgGroupId, groupName } = data;

      // Ignore messages from self - because temp msg already being displayed 
      if (message.senderId === loggedInUserId) return;

      if (groupId && parseInt(groupId) === parseInt(msgGroupId)) {
        dispatch(addGroupMessage(message));
      }

      dispatch(appendUnreadGroup(msgGroupId));

      if (
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        const notif = new Notification(`ChatApp - ${groupName}`, {
          body: `New message`,
          icon: "/icon.png",
        });

        notif.onclick = () => {
          window.focus();
          navigate(`/groupchat/${msgGroupId}`);
        };
      }
    });

    socket.on("group-messages-seen", ({ by, groupId, groupMsgReadIds }) => {
      dispatch(markGroupMessagesAsSeen({ by, groupId, groupMsgReadIds }));
    });

    socket.on('deleteGroupMessage', (data) => {
      const { message } = data;
      dispatch(deleteGroupMsgAction(message));
    });

    socket.on('editGroupMessage', (data) => {
      const { message } = data;
      dispatch(editGroupMsgAction(message));
    });

    // New: Handle groupTyping
    socket.on("groupTyping", ({ groupId: typingGroupId, senderId, isTyping }) => {
      if (setIsTyping && typingGroupId === parseInt(groupId) && senderId !== loggedInUserId) {
        setIsTyping(isTyping);
      }
    });

    return () => {
      // Detach only listeners, not socket itself
      socket.off("newFriendReqSent");
      socket.off("friendAccepted");
      socket.off("newMessage");
      socket.off('deleteMessage');
      socket.off('editMessage');
      socket.off('messageReaction');
      socket.off('messageReactionRemoved');
      socket.off("typing");
      socket.off("groupCreated");
      socket.off("groupJoined");
      socket.off("newGroupMessage");
      socket.off("deleteGroupMessage");
      socket.off("editGroupMessage");
      socket.off("groupTyping");
    };
  }, [token, chatUserId, groupId, loggedInUserId, setIsTyping, groups, chatType, dispatch, navigate]);

  return socketInstance;
}