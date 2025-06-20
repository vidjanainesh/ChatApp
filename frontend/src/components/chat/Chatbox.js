import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage } from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import { motion } from "framer-motion";
import EmojiPicker from "emoji-picker-react";

export default function Chatbox() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name");

  const token = localStorage.getItem("jwt");
  const chatWindowRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const stableAlert = useCallback(() => { }, []);
  const socketRef = useSocket({
    token,
    chatUserId: id,
    loggedInUserId,
    setMessages,
    setIsTyping,
    onNewMessageAlert: stableAlert, // prevents global notification while inside Chatbox
  });

  const fetchMessages = async () => {
    try {
      const res = await getMessages(id, token);
      if (res.data.status === "success") {
        setMessages(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to get messages", { autoClose: 3000 });
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
    if (socketRef) {
      socketRef.emit("typing", {
        senderId: loggedInUserId,
        receiverId: parseInt(id),
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.emit("typing", {
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-white to-indigo-50 p-4">
      <div className="w-full max-w-md mx-auto flex flex-col h-[86vh] sm:h-[95vh] px-2 sm:px-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-indigo-600 hover:underline text-sm"
          >
            ← Back
          </button>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {/* {name.split().length === 0 ? `Chat with ${name}` : `Chat with ${name.split(' ')[0]}`} */}
            Chat with {name?.split(' ')[0]}
          </h2>
          <div className="w-12" />
        </div>

        <div
          className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 px-2 pb-4 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent"
          ref={chatWindowRef}
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
                  className={`flex ${isSender ? "justify-end" : "justify-start"
                    }`}
                >
                  <motion.div
                    initial={{ opacity: 0, x: isSender ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3 rounded-xl text-sm shadow-md w-fit max-w-[75%] break-words whitespace-pre-wrap ${isSender
                      ? "bg-indigo-100 self-end" // removed text-right
                      : "bg-white self-start"
                      }`}
                  >
                    <div className="text-left">{msg.message}</div> {/* ✅ force left text alignment */}
                    <div className="text-[10px] text-gray-400 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                    </div>
                  </motion.div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="text-sm text-gray-500 mb-2 h-5 px-1">
          {isTyping ? "Typing..." : "\u00A0"}
        </div>

        <div className="relative" ref={dropdownRef}>
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              className="absolute bottom-16 left-2 z-50 origin-bottom-left"
              style={{ transform: "scale(0.8)" }} // 👈 scales down the entire picker
            >
              <EmojiPicker
                onEmojiClick={(emojiData) => setInput((prev) => prev + emojiData.emoji)}
                theme="light"
              />
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center gap-2 bg-white p-2 mb-2.5 rounded-lg shadow-sm"
          >
            {/* Emoji Button on Left Inside Input */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 hover:text-indigo-500"
              title="Insert Emoji"
              style={{transform: 'scale(1.3)'}}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </button>
            {/* Textarea - Compact Height */}
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none min-h-[2.5rem] max-h-[5rem] overflow-y-auto"
              autoComplete="off"
              rows={1}
            />

            {/* Send Button */}
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
    </div>
  );
}