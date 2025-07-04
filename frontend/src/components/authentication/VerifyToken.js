import React, { useState } from "react";
import { verifyToken } from "../../api";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function VerifyToken() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  // console.log("Email: ",email);
  const [token, setToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await verifyToken({email, token});
      if (res.data.status === "success") {
        // const emailToken = res.data.emailToken;
        // localStorage.setItem('reset-jwt', emailToken);
        // toast.success("Token verified", { autoClose: 3000 });
        navigate("/reset-password", { state: { email: email } });
      } else {
        toast.error(res.data.message || "Token verification failed", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      toast.error(msg, { autoClose: 3000 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-100 to-white">
      <motion.div
        className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-2">Verify Token</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the token sent to your email
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="text-sm text-gray-600 block mb-1">
              Token
            </label>
            <input
              type="text"
              name="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter 4-digit token"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Verify Token
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-500">
          Back to{" "}
          <span
            onClick={() => navigate("/")}
            className="text-indigo-600 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </motion.div>
    </div>
  );
}