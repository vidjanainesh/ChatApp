import axios from 'axios';

// const API_BASE = 'http://localhost:3000/api';
const API_BASE = 'https://chatapp-ebgg.onrender.com/api';

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