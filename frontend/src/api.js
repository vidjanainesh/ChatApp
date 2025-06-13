import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_BASE}/api`;

export const registerUser = (data) => {
    return axios.post(`${API_BASE}/authenticate/register`, data);
}

export const loginUser = (data) => {
    return axios.post(`${API_BASE}/authenticate/login`, data);
}

export const forgetPassword = (data) => {
    return axios.post(`${API_BASE}/authenticate/forget-password`, data);
}

export const verifyToken = (data) => {
    return axios.post(`${API_BASE}/authenticate/verify-token`, data);
}

export const resetPassword = (data, token) => {
    return axios.post(`${API_BASE}/authenticate/reset-password`, 
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const sendMessage = (message, receiverId, token) => {
    return axios.post(`${API_BASE}/chat/send`,
        { message, receiverId }, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const getMessages = (id, token) => {
    return axios.get(`${API_BASE}/chat/get/${id}`, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const getUsers = (token) => {
    return axios.get(`${API_BASE}/chat/get`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}
// ---------------------------------------------------------
export const getFriends = (token) => {
    return axios.get(`${API_BASE}/friend`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const getFriendReq = (token) => {
    return axios.get(`${API_BASE}/friend/requests`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const sendFriendReq = (id, token) => {
    return axios.post(`${API_BASE}/friend/send`,
        { id }, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const manageFriendReq = (id, status, token) => {
    return axios.post(`${API_BASE}/friend/update`,
        { id, status }, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}