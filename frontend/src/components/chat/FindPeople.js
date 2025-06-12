import React, { useEffect, useState } from "react";
import { getUsers, sendFriendReq } from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function FindPeople() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers(token);
        if (response.data.status === "success") {
          setUsers(response.data.data);
        } else {
          toast.error(response.data.message || "Failed to fetch users");
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Error fetching users";
        toast.error(msg);
        if (msg === "Invalid or expired token") {
          localStorage.removeItem("jwt");
          navigate("/");
        }
      }
    };

    fetchUsers();
  }, [token, navigate]);

  const handleSendRequest = async (id) => {
    try {
      const response = await sendFriendReq(id, token);
      if (response.data.status === "success") {
        toast.success("Friend request sent!", { autoClose: 2000 });
        setUsers((prev) => prev.filter((user) => user.id !== id));
      } else {
        toast.error(response.data.message || "Failed to send request");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending request");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-700">Find People</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-300"
          >
            ← Back to Dashboard
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No more users to connect with.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                className="bg-white p-4 rounded-xl shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition duration-300"
                >
                  Send Friend Request
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
