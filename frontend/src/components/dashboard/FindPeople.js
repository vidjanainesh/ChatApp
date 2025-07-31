import React, { useEffect, useState } from "react";
import { getUsers, searchUsers, sendFriendReq } from "../../api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import debounce from 'lodash.debounce';
import { useDispatch } from "react-redux";
import { setHasFetchedDashboardData } from "../../store/userSlice";

export default function FindPeople() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = localStorage.getItem("jwt");
  const [users, setUsers] = useState([]);
  const [requestedIds, setRequestedIds] = useState([]);
  const [processingIds, setProcessingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, navigate]);

  const autoSearch = React.useMemo(() =>
    debounce(async (input) => {
      setSearching(true);
      try {
        const response = await searchUsers(input, token);
        if (response.data.status === 'success') {
          setSearchResults(response.data.data);
        } else {
          toast.error(response.data.message || 'Failed Search');
        }
      } catch (error) {
        toast.error(error.response?.data.message || 'Search Error');
      } finally {
        setSearching(false);
      }
    }, 300),
    [token]
  );

  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    autoSearch(searchInput);
    // setSearching(false);
  }, [searchInput, autoSearch]);

  useEffect(() => {
    return () => {
      autoSearch.cancel();
    }
  }, [autoSearch])

  const handleSendRequest = async (id) => {
    setProcessingIds((prev) => [...prev, id]);
    try {
      const response = await sendFriendReq(id, token);
      if (response.data.status === "success") {
        // toast.success("Friend request sent!", { autoClose: 2000 });
        setProcessingIds((prev) => prev.filter((reqId) => reqId !== id));
        setRequestedIds((prev) => [...prev, id]);
        dispatch(setHasFetchedDashboardData(false));
      } else {
        toast.error(response.data.message || "Failed to send request");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending request");
    } finally {

    }
  };

  // const visibleUsers = users.filter((user) => !requestedIds.includes(user.id));
  const displayUsers = searchInput.trim() ? searchResults : users;

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

        {!loading && (
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search people by name or email"
            className="flex-1 border border-gray-300 rounded-lg mb-5 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center text-gray-500 mt-6 h-[20vh]">
            <svg
              className="animate-spin h-6 w-6 text-indigo-500 mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm">Hang tight — searching for users to connect with...</p>
          </div>
        ) : searchInput.trim() && searching ? (
          <div className="flex flex-col items-center justify-center text-gray-500 mt-6 h-[20vh]">
            <svg
              className="animate-spin h-6 w-6 text-indigo-500 mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm">Searching users...</p>
          </div>
        ) : searchInput.trim() && displayUsers.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No matching users found.</p>
        ) : !searchInput.trim() && displayUsers.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No more users to connect with.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayUsers.map((user, index) => (
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
                {processingIds.includes(user.id) ? (
                  <div className="flex flex-col items-center mt-2 pt-4">
                    <div className="flex space-x-1">
                      <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={requestedIds.includes(user.id)}
                    className={`w-full ${requestedIds.includes(user.id)
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white"
                      } py-2 px-4 rounded-lg transition duration-300`}
                  >
                    {requestedIds.includes(user.id) ? "Request Sent" : "Send Friend Request"}
                  </button>
                )}

              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}