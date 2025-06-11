// src/components/chat/Dashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getUsers } from "../../api";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers(token);
        if (response.data.status !== "success") {
          toast.error(response.data.message || "Could not retrieve users", {
            autoClose: 3000,
          });
        } else {
          setUsers(response.data.data);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Something went wrong while fetching users";

        if (errorMessage === "Invalid or expired token") {
          toast.error("Invalid session. Please log in again.", {
            autoClose: 3000,
          });
          localStorage.removeItem("jwt");
          navigate("/");
        } else {
          toast.error(errorMessage, { autoClose: 3000 });
        }
      }
    };

    fetchUsers();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    toast.success("Logged out", { autoClose: 3000 });
    navigate("/");
  };

  const handleUserClick = (user) => {
    navigate(`/chatbox/${user.id}?name=${encodeURIComponent(user.name)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Welcome Back!</h1>
            <p className="text-gray-500">Stay connected and chat with your friends</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-300"
          >
            Logout
          </button>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 mb-4">Available Users:</h2>

        {users.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No users found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="bg-white p-4 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition duration-300"
                title={`Chat with ${user.name}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}