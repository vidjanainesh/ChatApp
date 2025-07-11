import React, { useState } from "react";
import { resetPassword } from "../../api";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { password, confirmPassword } = formData;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters", { autoClose: 3000 });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", { autoClose: 3000 });
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ password, email });
      if (res.data.status === "success") {
        // toast.success("Password reset successful", { autoClose: 3000 });
        setRedirecting(true);
        setTimeout(() => navigate("/"), 1000);
      } else {
        toast.error(res.data.message || "Reset failed", { autoClose: 3000 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
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
          Update Your Password
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Secure your account with a new password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="text-sm text-gray-600 block mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm text-gray-600 block mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={redirecting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            {loading ? "Changing..." : redirecting ? "Password Updated" : "Change Password"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-500">

          {redirecting ? (
            <span
              className="text-indigo-600 cursor-pointer hover:underline"
            >
              Taking you back to login...
            </span>
          ) : (
            <>
              Back to{" "}
              <span
                onClick={() => navigate("/")}
                className="text-indigo-600 cursor-pointer hover:underline"
              >
                Login
              </span>
            </>
          )}

        </p>
      </motion.div>
    </div>
  );
}