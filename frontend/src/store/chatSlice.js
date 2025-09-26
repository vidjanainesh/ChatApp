import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [], // messages for current chat
  groupMessages: [], // for group chat
  botMessages: [],
  currentChat: null, // friend user ID or group ID
  chatType: "private", // "private" or "group"
  groupMembers: [],
  nonMemberFriends: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
      // console.log('Messages (Set):', JSON.parse(JSON.stringify(state.messages)));
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
      // console.log('Messages (Send):', JSON.parse(JSON.stringify(state.messages)));
    },
    updateMessageId: (state, action) => {
      const { tempId, newMessage } = action.payload;
      state.messages = state.messages.map((msg) =>
        msg.id === tempId ? newMessage : msg
      );
    },
    prependMessages: (state, action) => {
      state.messages = [...action.payload, ...state.messages];
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    editPrivateMessage: (state, action) => {
      const updatedMsg = action.payload;
      state.messages = state.messages.map((msg) =>
        // msg.id === updatedMsg.id ? updatedMsg : msg
        msg.id === updatedMsg.id ? { ...msg, message: updatedMsg.message, isEdited: true } : msg
      );
      // console.log('Updated messages (edit):', JSON.parse(JSON.stringify(state.messages)));
    },
    deletePrivateMessage: (state, action) => {
      const deletedMsg = action.payload;
      // console.log("Deleted Msg: ", deletedMsg);s
      state.messages = state.messages.map((msg) =>
        // msg.id === deletedMsg.id ? deletedMsg : msg
        msg.id === deletedMsg.id ? { ...msg, isDeleted: true } : msg
      );
      // console.log('Updated messages (del):', JSON.parse(JSON.stringify(state.messages)));
    },
    markMessagesAsSeen: (state, action) => {
      const { chatUserId, messageIds } = action.payload;
      state.messages = state.messages.map(msg =>
        msg.senderId === chatUserId && messageIds.includes(msg.id) ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
      );
    },
    addReactionToPrivateMessage: (state, action) => {
      const messageId = Number(action.payload.messageId);
      const reaction = action.payload.reaction;
      const message = state.messages.find((m) => m.id === messageId);
      if (message) {
        const existingIndex = message.reactions.findIndex(
          (r) => r.userId === reaction.userId
        );
        if (existingIndex !== -1) {
          // message.reactions = [
          //   ...message.reactions.slice(0, existingIndex),
          //   reaction,
          //   ...message.reactions.slice(existingIndex + 1)
          // ];
          message.reactions[existingIndex] = reaction;
        } else {
          // message.reactions = [...message.reactions, reaction];
          message.reactions.push(reaction);
        }
      }
    },
    removeReactionFromPrivateMessage: (state, action) => {
      const { messageId, userId } = action.payload;
      const message = state.messages.find((m) => m.id === messageId);
      if (message) {
        message.reactions = message.reactions.filter((r) => r.userId !== userId);
      }
    },
    setGroupMessages: (state, action) => {
      state.groupMessages = action.payload;
      // console.log('Set messages:', JSON.parse(JSON.stringify(state.groupMessages)));
    },
    addGroupMessage: (state, action) => {
      state.groupMessages.push(action.payload);
      // console.log('Add messages:', JSON.parse(JSON.stringify(state.groupMessages)));
    },
    updateGroupMessageId: (state, action) => {
      const { tempId, newMessage } = action.payload;
      state.groupMessages = state.groupMessages.map((msg) =>
        msg.id === tempId ? newMessage : msg
      );
    },
    prependGroupMessages: (state, action) => {
      state.groupMessages = [...action.payload, ...state.groupMessages];
    },
    clearGroupMessages: (state) => {
      state.groupMessages = [];
    },
    editGroupMsgAction: (state, action) => {
      const updatedMsg = action.payload;
      state.groupMessages = state.groupMessages.map((msg) =>
        // msg.id === updatedMsg.id ? updatedMsg : msg
        msg.id === updatedMsg.id ? { ...msg, message: updatedMsg.message, isEdited: true } : msg
      );
      // console.log('Updated Group Messages (edit):', JSON.parse(JSON.stringify(state?.groupMessages)));
    },
    deleteGroupMsgAction: (state, action) => {
      const deletedMsg = action.payload;
      state.groupMessages = state.groupMessages.map((msg) =>
        // msg.id === deletedMsg.id ? deletedMsg : msg
        msg.id === deletedMsg.id ? { ...msg, isDeleted: true } : msg
      );
    },
    markGroupMessagesAsSeen: (state, action) => {
      const { by, groupMsgReadIds } = action.payload;
      state.groupMessages = state.groupMessages.map(msg => {
        return {
          ...msg,
          reads: msg?.reads?.map(curr =>
            curr.userId === by && groupMsgReadIds.includes(curr.id) ? { ...curr, readAt: new Date().toISOString() } : curr
          )
        }
      });
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload.data;
      state.chatType = action.payload.type;
    },
    addBotMessage: (state, action) => {
      state.botMessages.push(action.payload);
      // console.log('Messages (Send):', JSON.parse(JSON.stringify(state.messages)));
    },
    setBotMessages: (state, action) => {
      state.botMessages = action.payload;
    },
    // updateBoxMessageId: (state, action) => {
    //   const { tempId, newMessage } = action.payload;
    //   state.messages = state.messages.map((msg) =>
    //     msg.id === tempId ? newMessage : msg
    //   );
    // },
    prependBotMessages: (state, action) => {
      state.botMessages = [...action.payload, ...state.botMessages];
    },
    updateBotMessageId: (state, action) => {
      const { tempId, newMessage } = action.payload;
      state.botMessages = state.botMessages.map((msg) =>
        msg.id === tempId ? { ...msg, chatbotReply: newMessage.chatbotReply } : msg
      )

    },
    clearChatState: (state) => {
      state.messages = [];
      state.groupMessages = [];
      state.currentChat = null;
      state.chatType = "private";
    },
    setGroupMembers: (state, action) => {
      state.groupMembers = action.payload;
    },
    addGroupMembers: (state, action) => {
      state.groupMembers = [...state.groupMembers, ...action.payload];
    },
    // removeGroupMembers: (state, action) => {

    // },
    setNonMemberFriends: (state, action) => {
      state.nonMemberFriends = action.payload;
    },
    removeNonMemberFriends: (state, action) => {
      const newMembers = action.payload;
      state.nonMemberFriends = state.nonMemberFriends.filter((frnd) => {
        return !newMembers.some((mem) => mem.id === frnd.id)
      });
    },
    addReactionToGroupMessage: (state, action) => {
      const messageId = Number(action.payload.messageId);
      const reaction = action.payload.reaction;
      const message = state.groupMessages.find((m) => m.id === messageId);
      if (message) {
        const existingIndex = message.reactions.findIndex(
          (r) => r.userId === reaction.userId
        );
        if (existingIndex !== -1) {
          // message.reactions = [
          //   ...message.reactions.slice(0, existingIndex),
          //   reaction,
          //   ...message.reactions.slice(existingIndex + 1)
          // ];
          message.reactions[existingIndex] = reaction;
        } else {
          // message.reactions = [...message.reactions, reaction];
          message.reactions.push(reaction);
        }
      }
    },
    removeReactionFromGroupMessage: (state, action) => {
      // console.log('Group messages (Brem):', JSON.parse(JSON.stringify(state.groupMessages)));
      const { messageId, userId } = action.payload;
      const message = state.groupMessages.find((m) => m.id === messageId);
      if (message) {
        message.reactions = message.reactions.filter((r) => r.userId !== userId);
      }
    },
  },
});

export const {
  setMessages,
  addMessage,
  updateMessageId,
  prependMessages,
  clearMessages,
  editPrivateMessage,
  deletePrivateMessage,
  markMessagesAsSeen,
  addReactionToPrivateMessage,
  removeReactionFromPrivateMessage,
  setGroupMessages,
  addGroupMessage,
  updateGroupMessageId,
  prependGroupMessages,
  clearGroupMessages,
  editGroupMsgAction,
  deleteGroupMsgAction,
  markGroupMessagesAsSeen,
  setCurrentChat,
  addBotMessage,
  setBotMessages,
  prependBotMessages,
  updateBotMessageId,
  clearChatState,
  setGroupMembers,
  addGroupMembers,
  setNonMemberFriends,
  removeNonMemberFriends,
  addReactionToGroupMessage,
  removeReactionFromGroupMessage,
} = chatSlice.actions;

export default chatSlice.reducer;