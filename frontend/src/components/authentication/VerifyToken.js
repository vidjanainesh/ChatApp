import React, { useState } from 'react';
import {verifyToken} from '../../api';
import { useLocation, useNavigate} from 'react-router-dom';
import { toast } from 'react-toastify';

export default function VerifyToken() {

    const location = useLocation();
    const navigate = useNavigate();

    // const email = location.state.email;
    const email = sessionStorage.getItem('email');
    const [token, setToken] = useState('');

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const response = await verifyToken({token, email});
            if(response.data.status === 'success'){
                const jwt = response.data.jsonToken;
                toast.success('OTP Verified', {autoClose: 3000});
                sessionStorage.removeItem('email');
                sessionStorage.setItem('reset_jwt', jwt);
                navigate('/reset-password');
            }
            else toast.error(response.data.message || 'Invalid OTP', {autoClose: 3000});
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Invalid OTP!';
            toast.error(errorMessage, { autoClose: 3000 });
        }
    }
    
    const handleChange = (e) => {
        setToken(e.target.value);
    }

    return (
    <div className="verify-token-container">
        <h2>Verify OTP</h2>
        <p>Enter the One-Time Password (OTP) sent to your email</p>

        <form onSubmit={submitHandler} className="verify-token-form">
        <div className="form-group">
            <label htmlFor="token">OTP</label>
            <input 
            type="text" 
            id="token"
            name="token" 
            placeholder="Enter the 4-digit OTP" 
            value={token} 
            onChange={handleChange} 
            required 
            />
        </div>

        <button type="submit" className="verify-button">Verify OTP</button>
        </form>
    </div>
    );

}
