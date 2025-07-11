import React, { useEffect, useState } from "react";
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { loginUser, googleLogin } from "../../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { setUser } from '../../store/userSlice';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      navigate('/dashboard')
    }
  });


  const handleChange = (e) =>
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginUser(loginForm);
      if (response.data.status === "success") {

        const token = response.data.data;
        const decodedUser = jwtDecode(token);
        localStorage.setItem("jwt", response.data.data);
        dispatch(setUser({ user: decodedUser, token }));
        navigate("/dashboard");
      } else {
        toast.error(response.data.message || "Login failed", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (googleToken) => {
    setLoading(true);
    try {
      const decodedUser = jwtDecode(googleToken);
      // console.log(decodedUser);

      const data = {
        name: decodedUser.name,
        email: decodedUser.email
      };
      const response = await googleLogin(data);

      if (response.data.status === "success") {
        const token = response.data.data;
        const decodedUser = jwtDecode(token);
        localStorage.setItem("jwt", response.data.data);
        dispatch(setUser({ user: decodedUser, token }));
        navigate("/dashboard");
      } else {
        toast.error(response.data.message || "Google login failed", { autoClose: 3000 });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Google login failed";
      toast.error(message, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // const login = useGoogleLogin({
  //   onSuccess: (tokenResponse) => {
  //     const googleToken = tokenResponse.credential;
  //     handleGoogleLogin(googleToken);
  //   },
  //   onError: () => {
  //     toast.error("Google Login Failed", { autoClose: 3000 });
  //   },
  // });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-white to-purple-100 px-4">
      <motion.div
        className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800">Welcome!</h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Login to your account to continue
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          <div>
            <label htmlFor="email" className="text-gray-700 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={loginForm.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-gray-700 text-sm font-medium">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={loginForm.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition duration-300"
          >
            {loading ? "Just a moment..." : "Log In"}
          </button>
        </form>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-xs flex justify-center">
            <GoogleLogin
              text="continue_with"
              shape="pill"
              theme="outline"
              size="large"
              onSuccess={credentialResponse => {
                // this gives you the Google ID token
                const googleToken = credentialResponse.credential;
                handleGoogleLogin(googleToken);
              }}
              onError={() => {
                toast.error("Google Login Failed", { autoClose: 3000 });
              }}
            />
          </div>
        </div>
        <div className="text-sm text-center mt-3 space-y-1">
          <p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-blue-500 hover:underline transition"
            >
              Forgot Password?
            </button>
          </p>
          <p>
            Don’t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-500 hover:underline transition"
            >
              Register
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}