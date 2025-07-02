import React, { useEffect, useState, useRef, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage, deleteMessage, editMessage, reactMessage, deleteReactions } from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, editPrivateMessage, deletePrivateMessage, clearMessages, clearChatState, addReactionToPrivateMessage, prependMessages } from "../../store/chatSlice";
import { HiOutlineChat } from "react-icons/hi";

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
  const inputRef = useRef(null);
  const hasInitScrolled = useRef(false);
  const lastMessageId = useRef(null);

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
  const [editMode, setEditMode] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageLoading, setMessageLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reactionPickerId, setReactionPickerId] = useState(null);
  const [showFullEmojiPickerId, setShowFullEmojiPickerId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  const socketRef = useSocket({
    token,
    chatUserId: id,
    loggedInUserId,
    setIsTyping,
  });

  const fetchMessages = useCallback(async (beforeId = null) => {
    if (beforeId) {
      setLoadingOlder(true);
    } else {
      setMessageLoading(true);
    }
    try {
      const res = await getMessages(id, beforeId, token);
      if (res.data.status === "success") {
        const newMessages = res.data.data;

        if (beforeId) {
          // Prepending older
          if (newMessages.length < 9) setHasMore(false);
          dispatch(prependMessages(newMessages));
        } else {
          dispatch(setMessages(newMessages));
          setFirstLoadDone(true);
        }
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
      if (beforeId) {
        setLoadingOlder(false);
      } else {
        setMessageLoading(false);
      }
    }
  }, [id, token, dispatch, navigate]);

  // On chat change: clear and fetch
  useEffect(() => {
    dispatch(clearMessages());
    fetchMessages();
    hasInitScrolled.current = false; // reset initial scroll on chat change
    return () => {
      dispatch(clearChatState());
    };
  }, [id, fetchMessages, dispatch, socketRef, loggedInUserId]);

  // Infinite scroll: load older and maintain position
  useEffect(() => {
    const handleScroll = () => {
      if (!chatWindowRef.current || !hasMore) return;

      if (chatWindowRef.current.scrollTop === 0) {
        const oldestMsgId = messages[0]?.id;
        if (oldestMsgId) {
          chatWindowRef.current.previousScrollHeight = chatWindowRef.current.scrollHeight;
          fetchMessages(oldestMsgId);
        }
      }
    };

    const ref = chatWindowRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, [messages, hasMore, fetchMessages]);

  // 1. Initial load scroll
  useEffect(() => {
    if (!messageLoading && messages.length && chatWindowRef.current) {
      if (!hasInitScrolled.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        hasInitScrolled.current = true;
      }
    }
  }, [messageLoading, messages]);

  // 2. Maintain scroll after fetching older
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!loadingOlder && el?.previousScrollHeight) {
      el.scrollTop = el.scrollHeight - el.previousScrollHeight;
      el.previousScrollHeight = null;
    }
  }, [loadingOlder]);

  // 3. Scroll to bottom if new and you are near bottom
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el || messages.length === 0) return;

    const newLastMessageId = messages[messages.length - 1]?.id;

    if (lastMessageId.current !== newLastMessageId) {
      const threshold = 400;
      const isNearBottom = el.scrollHeight - (el.scrollTop + el.clientHeight) < threshold;

      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }

      lastMessageId.current = newLastMessageId;
    }
  }, [messages]);

  // Mark messages seen
  useEffect(() => {
    if (socketRef) {
      socketRef.emit("mark-messages-seen", {
        userId: loggedInUserId,
        chatUserId: parseInt(id)
      });
    }
  }, [messages.length, socketRef, loggedInUserId, id]);


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
      }, 1000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setShowEmojiPicker(false);

    if (editMode) {
      try {
        const res = await editMessage(editMode.id, input, token);
        if (res.data.status === "success") {
          dispatch(editPrivateMessage(res.data.data));
          setEditMode(null);  // exit edit mode
          setInput("");       // clear input
          setReplyTo(null);
        }
      } catch {
        toast.error("Failed to edit message");
      }
    } else {

      socketRef.emit("typing", {
        senderId: loggedInUserId,
        receiverId: parseInt(id),
        isTyping: false,
      });

      try {
        const res = await sendMessage(input, id, token, replyTo?.id || null);
        if (res.data.status === "success") {
          setInput("");  // clear input
          setReplyTo(null);
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

  const handleEditClick = (msg) => {
    setEditMode(msg);          // mark as editing this message
    setInput(msg.message);     // prefill the bottom textarea
    setShowEmojiPicker(false); // close emoji picker

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 0);
  };

  const handleReplyClick = (msg) => {
    setReplyTo(msg);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 0);
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
            Chat with {name?.split(' ')[0]}
          </h2>
          <div className="w-12" />
        </div>

        <div
          className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 px-2 pb-4 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent"
          ref={chatWindowRef}
        >
          {loadingOlder && (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-t-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

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
              const userReaction = msg.reactions?.find(r => r.userId === loggedInUserId);

              return (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  prevDate={prevDate !== currentDate ? currentDate : null}
                  isSender={isSender}
                  userReaction={userReaction}
                  availableReactions={availableReactions}
                  onReact={handleReact}
                  onReply={handleReplyClick}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  reactionPickerId={reactionPickerId}
                  setReactionPickerId={setReactionPickerId}
                  showFullEmojiPickerId={showFullEmojiPickerId}
                  setShowFullEmojiPickerId={setShowFullEmojiPickerId}
                  reactionPickerRef={reactionPickerRef}
                  fullReactionPickerRef={fullReactionPickerRef}
                  formatTime={formatTime}
                  selectedMessage={selectedMessage}
                  setSelectedMessage={setSelectedMessage}
                  loggedInUserId={loggedInUserId}
                />
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
                    handleEditClick(selectedMessage);
                    setSelectedMessage(null); // close modal immediately({ ...selectedMessage, mode: "edit" });
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

          {editMode && (
            <div className="flex items-center justify-between text-xs text-yellow-700 bg-yellow-50 border border-yellow-300 rounded p-1 px-2 mb-1">
              Editing message...
              <button
                onClick={() => {
                  setEditMode(null);
                  setInput("");
                }}
                className="text-red-500 hover:underline text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {replyTo && (
            <div className="flex items-center justify-between bg-blue-50 border-l-4 border-blue-400 rounded-md shadow-sm p-2 mb-2">
              <div className="flex-1 text-xs text-grey-300 truncate">
                Replying to: <span className="font-semibold">{replyTo.message}</span>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-xs text-red-500 hover:underline ml-3 shrink-0"
              >
                Cancel
              </button>
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
              ref={inputRef}
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