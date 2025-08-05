import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import Register from './components/authentication/Register';
import Login from './components/authentication/Login';
import ForgotPassword from './components/authentication/ForgotPassword';
import VerifyToken from './components/authentication/VerifyToken';
import ResetPassword from './components/authentication/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';
import FindPeople from './components/dashboard/FindPeople';
import FriendRequests from './components/dashboard/FriendRequests';
import Chatbox from './components/chat/Chatbox';
import GroupChatbox from './components/chat/GroupChatbox';
import Profile from './components/dashboard/Profile';
import GroupInfo from './components/chat/GroupInfo';

function App() {

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-gray-800">
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/verify-token' element={<VerifyToken />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/chat/:id' element={<Chatbox />} />
        <Route path='/groupchat/:id' element={<GroupChatbox />} />
        <Route path='/find-people' element={<FindPeople />} />
        <Route path='/friend-requests' element={<FriendRequests />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/profile/:id' element={<Profile />} />
        <Route path='/group/:id' element={<GroupInfo />} />
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
