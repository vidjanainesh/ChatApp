import React, { useState } from 'react'
import {forgetPassword} from '../../api.js'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './auth.css';

export default function ForgetPassword() {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const response = await forgetPassword({email});
            // console.log(response);
            if(response.data.status === 'success'){
                toast.success('OTP Sent', {autoClose: 3000});
                sessionStorage.setItem('email', email);
                navigate('/verify-token')
            }
            else toast.error(response.data.message || 'Could not send OTP!', { autoClose: 3000 });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Could not send OTP!';
            toast.error(errorMessage, { autoClose: 3000 });
        }
    }
    
    const handleChange = (e) => {
        setEmail(e.target.value);
    }

    return (
        <div className="auth-container">
            <h2>Forgot Your Password?</h2>
            <p>Enter your email to receive a verification code (OTP)</p>

            <form onSubmit={submitHandler} className="auth-form">
            <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                type="text" 
                id="email"
                name="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={handleChange} 
                required 
                />
            </div>

            <button type="submit" className="auth-button">Send OTP</button>
            </form>
        </div>
    );


}