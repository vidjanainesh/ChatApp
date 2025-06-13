import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/authentication/Login';
import Register from './components/authentication/Register';
import Dashboard from './components/chat/Dashboard';
import ForgotPassword from './components/authentication/ForgotPassword';
import VerifyToken from './components/authentication/VerifyToken';
import ResetPassword from './components/authentication/ResetPassword';
import Chatbox from './components/chat/Chatbox';
import { useEffect } from 'react';
import useGlobalNotifications from './hooks/useGlobalNotifications';
import FindPeople from './components/chat/FindPeople';
import FriendRequests from './components/chat/FriendRequests';

function App() {

  const token = localStorage.getItem("jwt");

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);
  useGlobalNotifications(token);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-white text-gray-800">
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/verify-token' element={<VerifyToken />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/chatbox/:id' element={<Chatbox />} />
        <Route path='/find-people' element={<FindPeople />} />
        <Route path='/friend-requests' element={<FriendRequests />} />
      </Routes>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>

    
  );
}

export default App;
