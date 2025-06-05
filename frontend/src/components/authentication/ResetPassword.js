import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api";
import { toast } from "react-toastify";
import './auth.css';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const jwt = sessionStorage.getItem("reset_jwt");
  const [password, setPassword] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const response = await resetPassword({ password }, jwt);
      console.log(response);
      if (response.data.status === "success") {
        // toast.success(response.data.message || "Password changed successfully", { autoClose: 3000 });
        sessionStorage.removeItem("reset_jwt");
        navigate("/");
      } else
        toast.error(response.data.message || "Could not change password", {
          autoClose: 3000,
        });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Could not change password";
      toast.error(errorMessage, { autoClose: 3000 });
    }
  };

  const handleChange = (e) => {
    setPassword(e.target.value);
  };

  return (
    <div className="auth-container">
      <h2>Reset Your Password</h2>
      <p>Enter your new password below</p>

      <form onSubmit={submitHandler} className="auth-form">
        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your new password"
            value={password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="auth-button">
          Change Password
        </button>
      </form>
    </div>
  );
}
