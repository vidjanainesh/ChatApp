import { useEffect, useState } from 'react'
import { loginUser } from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {jwtDecode} from 'jwt-decode';
import './auth.css';

export default function Login() {

  const [form, setForm] = useState({email: '', password: ''}); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    
    if(token){
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

      if (!isExpired) {
        navigate('/dashboard');
      } else {
        localStorage.removeItem('jwt');
        navigate('/');
      }
      } catch (err) {
        localStorage.removeItem('jwt');
        toast.error('Invalid session. Please log in again.', { autoClose: 3000 });
        navigate('/');
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(form);
      if(response.data.status === 'success') {
        toast.success('Login Successful', {autoClose: 3000});
        localStorage.setItem('jwt', response.data?.userToken);
        navigate('/dashboard');
      }
      // else throw new Error(response.data.message);
      else toast.error(response.data.message || 'Login Failed!', { autoClose: 3000 });

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login Failed!';
      toast.error(errorMessage, { autoClose: 3000 });
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value});
  }

  return (
    <div className="auth-container">
      <h2>Welcome Back!</h2>
      <p>Please log in to continue</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input 
            type="text" 
            id="email"
            name="email" 
            placeholder="Enter your email" 
            onChange={handleChange} 
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password"
            name="password" 
            placeholder="Enter your password" 
            onChange={handleChange} 
            required
          />
        </div>

        <button type="submit" className="auth-button">Log In</button>

        <div className="auth-links">
          <p>
            New here? <Link to="/register">Sign up</Link>
          </p>
          <p>
            <Link to="/forget-password">Forgot Password?</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
