import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getFriends } from "../../api";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt");
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await getFriends(token);
        if (response.data.status !== "success") {
          toast.error(response.data.message || "Could not retrieve friends", {
            autoClose: 3000,
          });
        } else {
          // console.log('User: ',response.data.user)
          setFriends(response.data.data);
          setUser(response.data.user)
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Something went wrong while fetching friends";

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

    fetchFriends();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    toast.success("Logged out", { autoClose: 3000 });
    navigate("/");
  };

  const handleUserClick = (user) => {
    navigate(`/chatbox/${user.id}?name=${encodeURIComponent(user.name)}`);
  };

  const goToFindPeople = () => {
    navigate("/find-people");
  };

  const goToFriendRequests = () => {
    navigate("/friend-requests");
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header: Welcome & Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">{user ? `Welcome Back ${user?.name.trim().split(' ')[0]}!` : `Welcome Back!`}</h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Stay connected and chat with your friends
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={goToFindPeople}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-base"
            >
              🔍 Find People
            </button>
            <button
              onClick={goToFriendRequests}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-base"
            >
              📨 Friend Requests
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Friends Section */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Friends:</h2>

        {friends.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No friends yet. Send some requests!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {friends.map((user, index) => (
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