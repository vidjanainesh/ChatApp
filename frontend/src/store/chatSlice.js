import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [], // messages for current chat
  groupMessages: [], // for group chat
  currentChat: null, // friend user ID or group ID
  chatType: "private", // "private" or "group"
  groupMembers: [],
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
      console.log('Messages (Send):', JSON.parse(JSON.stringify(state.messages)));
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
      const { chatUserId } = action.payload;
      state.messages = state.messages.map(msg =>
        msg.senderId === chatUserId ? { ...msg, isRead: true } : msg
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
      // console.log('Updated Group Messages (ini):', JSON.parse(JSON.stringify(state?.groupMessages)));
    },
    addGroupMessage: (state, action) => {
      state.groupMessages.push(action.payload);
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
    },
    deleteGroupMsgAction: (state, action) => {
      const deletedMsg = action.payload;
      state.groupMessages = state.groupMessages.map((msg) =>
        // msg.id === deletedMsg.id ? deletedMsg : msg
        msg.id === deletedMsg.id ? { ...msg, isDeleted: true } : msg
      );
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload.id;
      state.chatType = action.payload.type;
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
  prependMessages,
  clearMessages,
  editPrivateMessage,
  deletePrivateMessage,
  markMessagesAsSeen,
  addReactionToPrivateMessage,
  removeReactionFromPrivateMessage,
  setGroupMessages,
  addGroupMessage,
  prependGroupMessages,
  clearGroupMessages,
  editGroupMsgAction,
  deleteGroupMsgAction,
  setCurrentChat,
  clearChatState,
  setGroupMembers,
  addReactionToGroupMessage,
  removeReactionFromGroupMessage,
} = chatSlice.actions;

export default chatSlice.reducer;