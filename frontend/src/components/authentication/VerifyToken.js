import React, { useState } from "react";
import { verifyToken } from "../../api";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { setUser } from '../../store/userSlice';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from "react-redux";

export default function VerifyToken() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const email = location.state?.email;
  const mode = location.state?.mode;
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyToken({ email, token });
      if (res.data.status === "success") {

        if (mode === "forgetPassword") {
          navigate("/reset-password", { state: { email: email } });
        }
        else if (mode === "emailVerification") {
          // toast.success("Registration successful!", { autoClose: 3000 });
          // navigate("/");
          const token = res.data.data;
          const decodedUser = jwtDecode(token);
          localStorage.setItem("jwt", res.data.data);
          dispatch(setUser({ user: decodedUser, token }));
          navigate("/dashboard");
        }
      } else {
        toast.error(res.data.message || "Token verification failed", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      toast.error(msg, { autoClose: 3000 });
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-2">
          {mode === "emailVerification" && "Just One More Step!"}
          {mode === "forgetPassword" && "Let's Make Sure It's You!"}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-2">
          Enter the code sent to your email
        </p>
        <p className="text-sm text-indigo-500 text-center mb-6">
          {email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="text-sm text-gray-600 block mb-1">
              Token
            </label>
            <input
              type="text"
              name="token"
              maxLength="4"
              value={token}
              onChange={(e) =>
                setToken(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="
                w-full 
                tracking-[0.8em] 
                px-4 py-2 
                border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 
                text-center text-2xl 
                placeholder:tracking-normal
              "
              placeholder="• • • •"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            {loading ? "Verifying..." : "Verify"}
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