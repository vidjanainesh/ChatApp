import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUsers } from '../../api';
import './Dashboard.css';  // Import your CSS here

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt');

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers(token);
        if (response.data.status !== 'success') {
          toast.error(response.data.message || 'Could not retrieve people', { autoClose: 3000 });
        } else {
          setUsers(response.data.data);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Something went wrong while fetching users';

        if(errorMessage === 'Invalid or expired token'){
          toast.error('Invalid session. Please log in again.', { autoClose: 3000 });
          localStorage.removeItem('jwt');
          navigate('/');
        }
        else{
          toast.error(errorMessage, { autoClose: 3000 });
        }
      }
    };
    fetchUsers();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    toast.success('Logged out', { autoClose: 3000 });
    navigate('/');
  };

  const handleUserClick = (user) => {
    navigate(`/chatbox/${user.id}?name=${encodeURIComponent(user.name)}`);
  };

  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Welcome back!</h1>
      <h2 className="dashboard-subtitle">Stay connected — your friends are just a message away</h2>

      <h2 className="users-title">People You Can Chat With:</h2>
      {users.length === 0 ? (
        <p className="no-users-text">No users found.</p>
      ) : (
        <div className="users-grid">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="user-card"
              title={`Chat with ${user.name}`}
            >
              <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleLogout}
        className="logout-button"
      >
        Logout
      </button>
    </div>
  );
}
