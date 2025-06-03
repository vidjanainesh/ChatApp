import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUsers } from '../../api';

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
          navigate('/')
        }
        else{
          toast.error(errorMessage, { autoClose: 3000 });
        }
      }
    };
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    toast.success('Logged out', { autoClose: 3000 });
    navigate('/');
  };

  const handleUserClick = (user) => {
    // console.log('User clicked:', user);
    navigate(`/chatbox/${user.id}?name=${encodeURIComponent(user.name)}`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Dashboard</h1>
      <h3>You have successfully signed in!</h3>
      <button
        onClick={handleLogout}
        style={{
          backgroundColor: '#ff4d4f',
          color: '#fff',
          padding: '10px 20px',
          fontSize: '16px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.3s ease, transform 0.2s ease',
          marginBottom: '20px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#d9363e';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ff4d4f';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Logout
      </button>

      <h2>All Users:</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              style={{
                cursor: 'pointer',
                padding: '15px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                width: '250px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: '#fff',
                  fontSize: '18px'
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.name}</div>
                  <div style={{ color: '#777' }}>{user.email}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}