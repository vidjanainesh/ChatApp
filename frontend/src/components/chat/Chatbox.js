import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage, deleteMessage, editMessage } from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import { motion } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, editPrivateMessage, deletePrivateMessage, clearMessages } from "../../store/chatSlice";
import { HiDotsHorizontal } from "react-icons/hi";

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
  const modalRef = useRef();

  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messages);

  let loggedInUserId = null;
  try {
    const decoded = jwtDecode(token);
    loggedInUserId = decoded.id;
  } catch {
    localStorage.removeItem("jwt");
    toast.error("Invalid session. Please log in again.", { autoClose: 3000 });
    navigate("/");
  }

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingInput, setEditingInput] = useState("");

  const stableAlert = useCallback(() => { }, []);
  const socketRef = useSocket({
    token,
    chatUserId: id,
    loggedInUserId,
    setMessages: (msgs) => dispatch(setMessages(msgs)),
    setIsTyping,
    onNewMessageAlert: stableAlert, // prevents global notification while inside Chatbox
  });

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getMessages(id, token);
      if (res.data.status === "success") {
        dispatch(setMessages(res.data.data));
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
  }, [id, token, dispatch, navigate]);

  useEffect(() => {
    dispatch(clearMessages());
    fetchMessages();
  }, [id, fetchMessages, dispatch]);

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

    setShowEmojiPicker(false);
    try {
      const res = await sendMessage(input, id, token);
      if (res.data.status === "success") {
        setInput("");
        // dispatch(addMessage(res.data.data)) - Not needed since it is being dispatched from socket
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

  const handleDeleteClick = async () => {
    try {
      const res = await deleteMessage(selectedMessage.id, token);
      if (res.data.status === "success") {
        dispatch(deletePrivateMessage(res.data.data));
      }
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setSelectedMessage(null);
    }
  };

  const handleEditSave = async () => {
    try {
      const res = await editMessage(selectedMessage.id, editingInput, token);
      if (res.data.status === "success") {
        dispatch(editPrivateMessage(res.data.data));
        setSelectedMessage(null);
        setEditingInput("");
      }
    } catch {
      toast.error("Failed to edit message");
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }

      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedMessage(null);
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
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-4 text-sm">Loading chat...</div>
          ) : (
              messages.map((msg, i) => {
                const isSender = msg.sender_id === loggedInUserId;
                const currentDate = formatDate(msg.timestamp);
                const prevDate = i > 0 ? formatDate(messages[i - 1].timestamp) : null;

                return (
                  <React.Fragment key={msg.id}>
                    {prevDate !== currentDate && (
                      <div className="flex items-center justify-center my-4">
                        <hr className="flex-1 border-gray-300" />
                        <span className="px-3 text-xs text-gray-500">{currentDate}</span>
                        <hr className="flex-1 border-gray-300" />
                      </div>
                    )}
                    <div className={`flex ${isSender ? "justify-end" : "justify-start"} relative`}>
                      <motion.div
                        initial={{ opacity: 0, x: isSender ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`group p-3 rounded-xl text-sm shadow-md w-fit max-w-[75%] break-words whitespace-pre-wrap ${isSender ? "bg-indigo-100 self-end" : "bg-white self-start"
                          }`}
                      >
                        <div className="text-left">
                          {msg.is_deleted ? (
                            <span className="italic text-gray-400">This message was deleted</span>
                          ) : (
                            msg.message
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                          {formatTime(msg.createdAt)}{" "}
                          {!msg.is_deleted && msg.is_edited && <span className="italic">(edited)</span>}
                        </div>
                        {/* Icon positioned slightly outside top-right corner */}
                        {isSender && !msg.is_deleted && (
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedMessage(msg)}
                              className="text-gray-700 hover:text-indigo-600 focus:outline-none bg-gray-100 border border-gray-300 rounded-full p-1 shadow-sm"
                              title="Options"
                            >
                              <HiDotsHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>

                    </div>
                  </React.Fragment>
                );
              })
          )}

        </div>

        {selectedMessage && selectedMessage.mode !== "edit" && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-xl shadow-xl w-72" ref={modalRef}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Choose Action</h3>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setEditingInput(selectedMessage.message);
                    setSelectedMessage({ ...selectedMessage, mode: "edit" });
                  }}
                  className="text-indigo-600 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMessage?.mode === "edit" && (
          <div className="mb-2 flex gap-2 items-center bg-yellow-50 border border-yellow-300 p-2 rounded-md">
            <input
              className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
              value={editingInput}
              onChange={(e) => setEditingInput(e.target.value)}
            />
            <button
              onClick={handleEditSave}
              className="text-white bg-indigo-500 px-2 py-1 rounded-md text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setSelectedMessage(null);
                setEditingInput("");
              }}
              className="text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

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
              style={{ transform: 'scale(1.3)' }}
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