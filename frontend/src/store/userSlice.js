import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null, // { id, name, email, etc }
    token: null,
    friends: [],
    groups: [],
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
    },
});

export const { setUser, clearUser, setFriends, setGroups, addFriend } = userSlice.actions;
export default userSlice.reducer;
