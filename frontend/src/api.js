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

export const getUnreadMessages = (token) => {
  return axios.get(`${API_BASE}/chat/unread`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


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
    return axios.post(`${API_BASE}/friend/update`,
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

export const getGroupData = (id, token) => {
    return axios.get(`${API_BASE}/group/data/${id}`, 
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

export const getUnreadGroupMessages = (token) => {
    return axios.get(`${API_BASE}/group/unread`, 
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
} 

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
 