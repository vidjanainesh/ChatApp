import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_BASE}/api`;

export const registerUser = (data) => {
    return axios.post(`${API_BASE}/auth/register`, data);
}

export const loginUser = (data) => {
    return axios.post(`${API_BASE}/auth/login`, data);
}

export const googleLogin = (data) => {
    return axios.post(`${API_BASE}/auth/google-login`, data);
}

export const forgetPassword = (data) => {
    return axios.post(`${API_BASE}/auth/forget-password`, data);
}

export const verifyToken = (data) => {
    return axios.post(`${API_BASE}/auth/verify-token`, data);
}

export const resetPassword = (data) => {
    return axios.post(`${API_BASE}/auth/reset-password`, data);
}
// ---------------------------------------------------------------------

export const getDashboardData = (token) => {
    return axios.get(`${API_BASE}/dashboard`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
}

// ---------------------------------------------------------------------

export const sendMessage = (formData, token) => {
    return axios.post(`${API_BASE}/chat`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}
export const deleteMessage = (id, token) => {
    return axios.delete(`${API_BASE}/chat/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}
export const editMessage = (id, msg, token) => {
    return axios.patch(`${API_BASE}/chat/${id}`,
        { msg },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const getMessages = (id, beforeId, token) => {
    const params = beforeId ? `?beforeId=${beforeId}` : '';
    return axios.get(`${API_BASE}/chat/${id}${params}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

// ---------------------------------------------------------

export const getUsers = (token) => {
    return axios.get(`${API_BASE}/user`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
};

export const searchUsers = (input, token) => {
    return axios.post(`${API_BASE}/user/search`,
        { input }, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
};

// ---------------------------------------------------------

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
    return axios.post(`${API_BASE}/friend`,
        { id },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const unFriend = (id, token) => {
    return axios.get(`${API_BASE}/friend/unfriend/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
}

export const manageFriendReq = (id, status, token) => {
    return axios.patch(`${API_BASE}/friend`,
        { id, status },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

// ---------------------------------------------------------
export const createGroup = (data, token) => {
    return axios.post(`${API_BASE}/group`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const joinGroup = (data, token) => {
    return axios.post(`${API_BASE}/group/join`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
};

export const leaveGroup = (id, token) => {
    return axios.get(`${API_BASE}/group/leave/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
};

export const sendGroupMessage = (data, token) => {
    return axios.post(`${API_BASE}/group/send-message`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const deleteGroupMessage = (id, token) => {
    return axios.delete(`${API_BASE}/group/message/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}
export const editGroupMessage = (id, msg, token) => {
    return axios.patch(`${API_BASE}/group/message/${id}`,
        { msg },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const getGroupData = (id, token, beforeMessageId) => {
    const params = beforeMessageId ? `?beforeMessageId=${beforeMessageId}` : '';
    return axios.get(`${API_BASE}/group/data/${id}${params}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

// Not needed now
// export const getGroupMembers = (id, token) => {
//     return axios.get(`${API_BASE}/group/${id}`,
//         {
//             headers: {
//                 Authorization: `Bearer ${token}`
//             }
//         }
//     );
// } 

export const getGroups = (token) => {
    return axios.get(`${API_BASE}/group`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const deleteGroup = (id, token) => {
    return axios.delete(`${API_BASE}/group/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
}

// -------------------------------------------------------------------

export const reactMessage = (id, { targetType, reaction }, token) => {
    return axios.post(`${API_BASE}/react/${id}`,
        { targetType, reaction },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
}

export const deleteReactions = (id, token) => {
    return axios.delete(`${API_BASE}/react/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
}