import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/authentication/Login';
import Register from './components/authentication/Register';
import Dashboard from './components/chat/Dashboard';
import ForgetPassword from './components/authentication/ForgetPassword';
import VerifyToken from './components/authentication/VerifyToken';
import ResetPassword from './components/authentication/ResetPassword';
import Chatbox from './components/chat/Chatbox';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path='/' element={<Login/>} />
            <Route path='/register' element={<Register/>} />
            <Route path='/dashboard' element={<Dashboard/>} />
            <Route path='/forget-password' element={<ForgetPassword/>} />
            <Route path='/verify-token' element={<VerifyToken/>} />
            <Route path='/reset-password' element={<ResetPassword/>} />
            <Route path='/chatbox/:id' element={<Chatbox/>} />
          </Routes>          
        </header>
      </div>
      <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />

    </Router>
    
  );
}

export default App;
