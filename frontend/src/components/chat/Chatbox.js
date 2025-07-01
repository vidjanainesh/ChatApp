import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage, deleteMessage, editMessage, reactMessage, deleteReactions } from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import { motion } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, editPrivateMessage, deletePrivateMessage, clearMessages, clearChatState, addReactionToPrivateMessage} from "../../store/chatSlice";
import { HiDotsHorizontal, HiOutlineChat, HiEmojiHappy, HiPlusSm } from "react-icons/hi";

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
  const reactionPickerRef = useRef();
  const fullReactionPickerRef = useRef();

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
  const [messageLoading, setMessageLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingInput, setEditingInput] = useState("");
  const [reactionPickerId, setReactionPickerId] = useState(null);
  const [showFullEmojiPickerId, setShowFullEmojiPickerId] = useState(null);
  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];


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
    setMessageLoading(true);
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
    } finally {
      setMessageLoading(false);
    }
  }, [id, token, dispatch, navigate]);

  useEffect(() => {
    dispatch(clearMessages());
    fetchMessages();
  }, [id, fetchMessages, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearChatState()); // ✅ this clears messages, groupMessages, currentChat, etc.
    };
  }, [dispatch]);


  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages.length]);

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
        socketRef.emit("typing", {
          senderId: loggedInUserId,
          receiverId: parseInt(id),
          isTyping: false,
        });
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

  const handleReact = async (messageId, emoji, existingReaction) => {
    try {
      if (existingReaction && existingReaction.reaction === emoji) {
        await deleteReactions(messageId, token);
      } else {
        const response = await reactMessage(messageId, { targetType: "private", reaction: emoji }, token);
        dispatch(addReactionToPrivateMessage({
          messageId: response.data.data.messageId,
          reaction: response.data.data,
        }))
      }
      // fetchMessages(); // refresh reactions
    } catch (err) {
      toast.error("Failed to react to message");
    } finally {
      setReactionPickerId(null);
      setShowFullEmojiPickerId(null);
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
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

      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setReactionPickerId(null);
      }

      if (fullReactionPickerRef.current && !fullReactionPickerRef.current.contains(event.target)) {
        setShowFullEmojiPickerId(null);
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
          {messageLoading ? (
            <div className="text-center text-gray-400 mt-4 text-sm">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-10 space-y-2">
              <HiOutlineChat className="text-3xl text-indigo-400" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-gray-400">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isSender = msg.senderId === loggedInUserId;
              const currentDate = formatDate(msg.createdAt);
              const prevDate = i > 0 ? formatDate(messages[i - 1].createdAt) : null;

              // Get user's existing reaction for this message
              const userReaction = msg.reactions?.find(r => r.userId === loggedInUserId);

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
                      className={`group mb-2 p-3 rounded-xl text-sm shadow-md w-fit max-w-[75%] break-words whitespace-pre-wrap relative ${isSender ? "bg-indigo-100 self-end" : "bg-white self-start"}`}
                    >
                      <div className="text-left">
                        {msg.isDeleted === 1 ? (
                          <span className="italic text-gray-400">This message was deleted</span>
                        ) : (
                          msg.message
                        )}
                      </div>

                      <div className={`flex items-center mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                        <div className={`text-[10px] pr-0 text-gray-400 ${isSender ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.createdAt)}{" "}
                          {msg.isDeleted === 0 && msg.isEdited === 1 && <span className="italic">(edited)</span>}
                        </div>
                      </div>


                      {/* WhatsApp-style Message Reactions - Positioned at bottom-right of message bubble */}
                      {msg.reactions && msg.reactions.length > 0 && msg.isDeleted !== 1 && (
                        <div className={`absolute -bottom-3 ${isSender ? '-left-2' : '-right-2'} flex flex-wrap gap-1 max-w-[200px]`}>
                          {Object.entries(
                            msg.reactions.reduce((acc, reaction) => {
                              if (!acc[reaction.reaction]) {
                                acc[reaction.reaction] = [];
                              }
                              acc[reaction.reaction].push(reaction);
                              return acc;
                            }, {})
                          ).map(([emoji, reactions]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji, userReaction)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all duration-200 shadow-md border-2 backdrop-blur-sm ${reactions.some(r => r.userId === loggedInUserId)
                                ? 'bg-indigo-100/90 text-indigo-800 border-indigo-200 hover:bg-indigo-200/90'
                                : 'bg-white/90 text-gray-600 border-gray-200 hover:bg-gray-50/90 hover:shadow-lg'
                                } transform hover:scale-105`}
                              title={reactions.map(r => r.userName?.split(' ')[0] || 'Someone').join(', ')}
                            >
                              <span className="text-[12px]">{emoji}</span>
                              {reactions.length > 1 && (
                                <span className="font-semibold min-w-[12px] text-center text-[10px]">{reactions.length}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quick Reactions Picker */}
                      {reactionPickerId === msg.id && (
                        <div
                          ref={reactionPickerRef}
                          className={`absolute ${isSender ? 'right-0' : 'left-0'} bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 flex gap-1`}
                          style={{ transform: 'scale(0.9)', transformOrigin: isSender ? 'bottom right' : 'bottom left' }}
                        >
                          {availableReactions.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReact(msg.id, emoji, userReaction);
                              }}
                              className="hover:bg-gray-100 p-1 rounded text-lg transition-colors"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFullEmojiPickerId(msg.id);
                              setReactionPickerId(null);
                            }}
                            className="hover:bg-gray-100 p-1 rounded text-gray-500 transition-colors"
                            title="More reactions"
                          >
                            <HiPlusSm className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Full Emoji Picker for Reactions */}
                      {showFullEmojiPickerId === msg.id && (
                        <div className={`absolute ${isSender ? 'right-0' : 'left-0'} ${i < 3 ? 'top-full mt-2' : 'bottom-full mb-2'} z-30`}>
                          <div
                            ref={fullReactionPickerRef} 
                            style={{
                              transform: "scale(0.6)",
                              transformOrigin: isSender
                                ? (i < 3 ? 'top right' : 'bottom right')
                                : (i < 3 ? 'top left' : 'bottom left')
                            }}
                          >
                            <EmojiPicker
                              onEmojiClick={(emojiData) => handleReact(msg.id, emojiData.emoji, userReaction)}
                              theme="light"
                            />
                          </div>
                        </div>
                      )}

                      {/* Icon positioned slightly outside top-right corner */}
                      <div className={`absolute -top-2 ${isSender ? '-right-2' : '-left-2'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {msg.isDeleted === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReactionPickerId(reactionPickerId === msg.id ? null : msg.id);
                            }}
                            className="text-gray-700 hover:text-indigo-600 focus:outline-none bg-gray-100 border border-gray-300 rounded-full p-1 shadow-sm transition-colors"
                            title="React"
                          >
                            <HiEmojiHappy className="w-3 h-3" />
                          </button>
                        )}

                        {msg.isDeleted === 0 && isSender && (
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="text-gray-700 hover:text-indigo-600 focus:outline-none bg-gray-100 border border-gray-300 rounded-full p-1 shadow-sm"
                            title="Options"
                          >
                            <HiDotsHorizontal className="w-3 h-3" />
                          </button>
                        )}
                      </div>
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