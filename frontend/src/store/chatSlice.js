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
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setGroupMessages: (state, action) => {
      state.groupMessages = action.payload;
    },
    addGroupMessage: (state, action) => {
      state.groupMessages.push(action.payload);
    },
    clearGroupMessages: (state) => {
      state.groupMessages = [];
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
    }

  },
});

export const {
  setMessages,
  addMessage,
  clearMessages,
  setGroupMessages,
  addGroupMessage,
  clearGroupMessages,
  setCurrentChat,
  clearChatState,
  setGroupMembers
} = chatSlice.actions;

export default chatSlice.reducer;