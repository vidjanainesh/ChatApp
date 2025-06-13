import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage } from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import { motion } from "framer-motion";

export default function Chatbox() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name");

  const token = localStorage.getItem("jwt");
  const chatWindowRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  let loggedInUserId = null;
  try {
    const decoded = jwtDecode(token);
    loggedInUserId = decoded.id;
  } catch {
    localStorage.removeItem("jwt");
    toast.error("Invalid session. Please log in again.", { autoClose: 3000 });
    navigate("/");
  }

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useSocket({
    id,
    token,
    loggedInUserId,
    setMessages,
    setIsTyping,
  });

  const fetchMessages = async () => {
    try {
      const res = await getMessages(id, token);
      if (res.data.status === "success") {
        setMessages(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to get messages", {
          autoClose: 3000,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Error getting messages";
      if (msg === "Invalid or expired token") {
        localStorage.removeItem("jwt");
        navigate("/");
      } else {
        toast.error(msg, { autoClose: 3000 });
      }
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [id]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (socketRef.current) {
      socketRef.current.emit("typing", {
        senderId: loggedInUserId,
        receiverId: parseInt(id),
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("typing", {
          senderId: loggedInUserId,
          receiverId: parseInt(id),
          isTyping: false,
        });
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await sendMessage(input, id, token);
      if (res.data.status === "success") {
        setInput("");
      } else {
        toast.error("Could not send message", { autoClose: 3000 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send message";
      if (msg === "Invalid or expired token") {
        localStorage.removeItem("jwt");
        navigate("/");
      } else {
        toast.error(msg, { autoClose: 3000 });
      }
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (ts) => new Date(ts).toISOString().split("T")[0];

  return (
    <div className="h-screen w-screen flex justify-center bg-gradient-to-tr from-white to-indigo-50 p-2 sm:p-4">
      <div className="flex flex-col w-full max-w-md h-full min-h-0 overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-2 mb-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-indigo-600 hover:underline text-sm"
          >
            ← Back
          </button>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
            Chat with {name.split(" ")[0]}
          </h2>
          <div className="w-12" />
        </div>

        {/* Message List */}
        <div
          ref={chatWindowRef}
          className="flex-1 min-h-0 overflow-y-auto px-2 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-indigo-400"
        >
          {messages.map((msg, i) => {
            const isSender = msg.sender_id === loggedInUserId;
            const currentDate = formatDate(msg.timestamp);
            const prevDate =
              i > 0 ? formatDate(messages[i - 1].timestamp) : null;

            return (
              <React.Fragment key={msg.id}>
                {prevDate !== currentDate && (
                  <div className="flex items-center justify-center my-4">
                    <hr className="flex-1 border-gray-300" />
                    <span className="px-3 text-xs text-gray-500">
                      {currentDate}
                    </span>
                    <hr className="flex-1 border-gray-300" />
                  </div>
                )}
                <div
                  className={`flex ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, x: isSender ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3 rounded-xl text-sm shadow-md w-fit max-w-[75%] break-words whitespace-pre-wrap ${
                      isSender ? "bg-indigo-100" : "bg-white"
                    }`}
                  >
                    <div className="text-left">{msg.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                    </div>
                  </motion.div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Typing Indicator */}
        <div className="text-sm text-gray-500 h-5 px-3 mb-1">
          {isTyping ? "Typing..." : "\u00A0"}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-white p-2 rounded-lg shadow-md mx-2 mb-1"
        >
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none min-h-[3.5rem] max-h-[30vh] overflow-y-auto"
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}