import React, { useEffect, useState } from "react";
import { getFriendReq, manageFriendReq } from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function FriendRequests() {
  const navigate = useNavigate();
  const token = localStorage.getItem("jwt");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getFriendReq(token);
        if (response.data.status === "success") {
          setRequests(response.data.data);
        } else {
          toast.error(response.data.message || "Failed to load requests");
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Error loading requests";
        toast.error(msg);
        if (msg === "Invalid or expired token") {
          localStorage.removeItem("jwt");
          navigate("/");
        }
      }
    };

    fetchRequests();
  }, [token, navigate]);

  const handleAction = async (id, status) => {
    try {
      const response = await manageFriendReq(id, status, token);
      if (response.data.status === "success") {
        // toast.success(`Request ${status}`, { autoClose: 2000 });
        setRequests((prev) => prev.filter((req) => req.senderId !== id));
      } else {
        toast.error(response.data.message || "Action failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error performing action");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-700">Friend Requests</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-300"
          >
            ← Back to Dashboard
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No pending friend requests.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {requests.map((req, index) => (
              <motion.div
                key={req.id}
                className="bg-white p-4 rounded-xl shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                    {req.sender.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{req.sender.name}</p>
                    <p className="text-sm text-gray-500">{req.sender.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req.senderId, "accepted")}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition duration-300"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(req.senderId, "rejected")}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-300"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}