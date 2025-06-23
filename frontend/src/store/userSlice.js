import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null, // { id, name, email, etc }
    token: null,
    friends: [],
    groups: [],
    unreadPrivateMap: {},
    unreadGroupMap: {},
    friendReqCount: 0,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
        },
        clearUser: (state) => {
            state.user = null;
            state.token = null;
            state.friends = [];
            state.groups = [];
            state.unreadPrivateMap = {};
            state.unreadGroupMap = {};
            state.friendReqCount = 0;
        },
        setFriends: (state, action) => {
            state.friends = action.payload;
        },
        addFriend: (state, action) => {
            state.friends.push(action.payload);
        },
        setGroups: (state, action) => {
            state.groups = action.payload;
        },
        setUnreadPrivateMap: (state, action) => {
            state.unreadPrivateMap = action.payload;
        },
        setUnreadGroupMap: (state, action) => {
            state.unreadGroupMap = action.payload;
        },
        appendUnreadPrivate: (state, action) => {
            state.unreadPrivateMap = {
                ...state.unreadPrivateMap,
                [action.payload]: true,
            }
        },
        appendUnreadGroup: (state, action) => {
            state.unreadGroupMap = {
                ...state.unreadGroupMap,
                [action.payload]: true,
            }
        },
        clearUnreadPrivateMapEntry: (state, action) => {
            delete state.unreadPrivateMap[action.payload];
        },
        clearUnreadGroupMapEntry: (state, action) => {
            delete state.unreadGroupMap[action.payload];
        },
        setFriendReqCount: (state, action) => {
            state.friendReqCount = action.payload;
        },
        incrementFriendReqCount: (state, action) => {
            state.friendReqCount += 1
        },
        resetFriendRequestCount: (state) => {
            state.friendReqCount = 0;
        },

    },
});

export const { 
    setUser, 
    clearUser, 
    setFriends, 
    setGroups, 
    addFriend, 
    setUnreadPrivateMap, 
    setUnreadGroupMap, 
    appendUnreadPrivate,
    appendUnreadGroup,
    clearUnreadPrivateMapEntry,
    clearUnreadGroupMapEntry,
    setFriendReqCount, 
    incrementFriendReqCount,
    resetFriendRequestCount,
} = userSlice.actions;

export default userSlice.reducer;
