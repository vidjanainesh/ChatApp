import React, { useState } from 'react'
import { registerUser } from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './auth.css';

export default function Register() {

  const [form, setForm] = useState({name: '', email: '', password: ''}); 

  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerUser(form);
      if(response.data.status === 'success'){

        // toast.success('Registraton successful!', {autoClose: 3000});
        navigate('/')
      }
      else toast.error(response.data.message || 'Registraton Failed!', {autoClose: 3000});
      // else throw new Error(response.data.message);

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration Failed!';
      toast.error(errorMessage, { autoClose: 3000 });
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value});
  }

  return (
    <div className="auth-container">
      <h2>Create Your Account</h2>
      <p>Fill in the details below to register</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input 
            type="text" 
            id="name"
            name="name" 
            placeholder="Enter your full name" 
            onChange={handleChange} 
            required
          />
        </div>

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
            placeholder="Create a password" 
            onChange={handleChange} 
            required
          />
        </div>

        <button type="submit" className="auth-button">Register</button>

        <div className="auth-links">
          <p>Already registered? <Link to="/">Sign in here</Link></p>
        </div>
      </form>
    </div>
  );

}