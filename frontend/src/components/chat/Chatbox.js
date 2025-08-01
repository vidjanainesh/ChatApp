import React, { useEffect, useState, useRef, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage, deleteMessage, editMessage, reactMessage, deleteReactions, sendFriendReq, whatsappNotify } from "../../api";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import EmojiPicker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, updateMessageId, editPrivateMessage, deletePrivateMessage, clearMessages, clearChatState, addReactionToPrivateMessage, prependMessages, addMessage } from "../../store/chatSlice";
import { HiOutlineChat, HiPaperClip, HiPhotograph, HiVideoCamera, HiChevronDown } from "react-icons/hi";
import { BsCheck, BsCheckAll, BsBellSlashFill, BsBellFill } from "react-icons/bs";
import { v4 as uuidv4 } from 'uuid';

import { formatRelativeTime, formatDate, formatTime, formatFullTimestamp } from "../../helper/formatDateAndTime";

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
  const actionModalRef = useRef();
  const reactionPickerRef = useRef();
  const fullReactionPickerRef = useRef();
  const inputRef = useRef(null);
  const hasInitScrolled = useRef(false);
  const lastMessageId = useRef(null);
  const fileInputRef = useRef();
  const isInitialLoad = useRef(true);

  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messages);

  let msgCount = -1;
  let loggedInUserId = null;

  try {
    const decoded = jwtDecode(token);
    loggedInUserId = decoded.id;
  } catch {
    localStorage.removeItem("jwt");
    toast.error("Invalid session. Please log in again.", { autoClose: 3000 });
    navigate("/");
  }

  const [friend, setFriend] = useState({});
  const [input, setInput] = useState("");
  const [editMode, setEditMode] = useState(null);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messageLoading, setMessageLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reactionPickerId, setReactionPickerId] = useState(null);
  const [showFullEmojiPickerId, setShowFullEmojiPickerId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [notFriend, setNotFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [seenModalData, setSeenModalData] = useState(null);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [notifyNewMessage, setNotifyNewMessage] = useState(false);
  const [loadingWANoti, setLoadingWANoti] = useState("idle");

  const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  const socketRef = useSocket({
    token,
    chatUserId: id,
    loggedInUserId,
    setIsTyping,
  });

  // Function to fetch messages
  const fetchMessages = useCallback(async (beforeId = null) => {
    if (beforeId) {
      setLoadingOlder(true);
    } else {
      setMessageLoading(true);
    }
    try {
      const res = await getMessages(id, beforeId, token);
      if (res.data.status === "success") {
        setFriend(res.data.data.friend);
        const friendshipStatus = res.data.data.friendship;
        const newMessages = res.data.data.messages;

        if (beforeId) {
          if (newMessages?.length < 9) setHasMore(false);
          dispatch(prependMessages(newMessages));
        } else {
          dispatch(setMessages(newMessages));
        }

        if (friendshipStatus === "accepted") {
          setNotFriend(false);
          setRequestSent(false);
        } else if (friendshipStatus === "pending") {
          setNotFriend(true);
          setRequestSent(true);
        } else {
          setNotFriend(true);
          setRequestSent(false);
        }

      }
      else {
        toast.error(res.data.message || "Failed to get messages", { autoClose: 3000 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Error getting messages";
      if (msg === "Invalid or expired token") {
        localStorage.removeItem("jwt");
        navigate("/");
      }
      else {
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

  //useEffect to place cursor on input field on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // useEffect to fetch messages / On chat change: clear and fetch
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
    if (!messageLoading && messages?.length && chatWindowRef.current) {
      if (!hasInitScrolled.current) {
        setTimeout(() => {
          if (firstUnreadMessageId) {
            // Scroll to the first unread message
            const el = document.getElementById(`msg_${firstUnreadMessageId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          } else {
            // Scroll to bottom if no unread marker
            scrollToBottom();
          }
          hasInitScrolled.current = true;
        }, 50);
      }
    }
  }, [messageLoading, messages, firstUnreadMessageId]);

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
    if (!el || messages?.length === 0) return;

    const newLastMessage = messages[messages.length - 1];
    const newLastMessageId = newLastMessage?.id;
    const isOwnMessage = newLastMessage?.senderId === loggedInUserId;

    if (isInitialLoad.current) {
      lastMessageId.current = newLastMessageId;
      isInitialLoad.current = false;

      // Already handled by initial scroll logic above
      return;
    }

    if (newLastMessageId === lastMessageId.current) return;

    lastMessageId.current = newLastMessageId;

    const threshold = 200;
    const isNearBottom = el.scrollHeight - (el.scrollTop + el.clientHeight) < threshold;

    if (isOwnMessage || isNearBottom) {
      scrollToBottom();
    } else {
      setNotifyNewMessage(true);
    }
  }, [messages, loggedInUserId]);

  // 4. Hide notify button if user scrolls to bottom manually
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 50;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      if (isAtBottom) {
        setNotifyNewMessage(false);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
      setNotifyNewMessage(false);
    }
  };

  // Mark messages seen
  useEffect(() => {
    if (!messageLoading && socketRef) {
      socketRef.emit("mark-messages-seen", {
        userId: loggedInUserId,
        chatUserId: parseInt(id),
      });
    }
  }, [messageLoading, messages.length, socketRef, loggedInUserId, id]);

  // First unread message for --- New Messages ---
  useEffect(() => {
    if (!messageLoading && messages?.length && firstUnreadMessageId === null) {
      const firstUnread = messages.find(
        m => !m.isRead && m.receiverId === loggedInUserId
      );
      if (firstUnread) {
        setFirstUnreadMessageId(firstUnread.id);
      }
    }
  }, [messageLoading, messages, loggedInUserId, firstUnreadMessageId]);

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
    if (!input.trim() && !selectedFile) return;

    // setIsSubmitting(true);
    setShowEmojiPicker(false);
    setInput("");       // clear input

    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);

    // Editing a message
    if (editMode) {
      setReplyTo(null);
      setEditMode(null); // exit edit mode
      try {
        dispatch(editPrivateMessage({ ...editMode, message: input }));

        const res = await editMessage(editMode.id, input, token);
        if (res.data.status === "success") {
          dispatch(editPrivateMessage(res.data.data));
        }
      } catch {
        toast.error("Failed to edit message");
      }

      // Send new message
    } else {

      socketRef.emit("typing", {
        senderId: loggedInUserId,
        receiverId: parseInt(id),
        isTyping: false,
      });

      try {
        const tempId = uuidv4();

        // Socket(Temporary) Message for showing the message instantly
        const message = {
          id: tempId,
          message: input,
          senderId: loggedInUserId,
          receiverId: parseInt(id),
          temp: true,
          repliedMessage: replyTo ? {
            id: replyTo.id,
            message: replyTo.message,
          } : null
        };
        setReplyTo(null);
        dispatch(addMessage(message));

        // For calling API and receiving the actual message object
        const formData = new FormData();
        formData.append("message", input);
        formData.append("receiverId", id);
        if (replyTo?.id) formData.append("replyTo", replyTo.id);
        if (selectedFile) formData.append("file", selectedFile);

        const res = await sendMessage(formData, token); // API Call

        if (res.data.status === "success") {
          const realMessage = res.data.data.message;
          dispatch(updateMessageId({ tempId, newMessage: realMessage }));
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
      finally {
        scrollToBottom();
        // setIsSubmitting(false);
      }
    }
  };

  const sendReq = async () => {
    setSendingRequest(true);
    try {
      const res = await sendFriendReq(parseInt(id), token);
      if (res.data.status === "success") {
        setRequestSent(true);
        // toast.success("Friend request sent!", { autoClose: 2000 });
      } else {
        toast.error(res.data.message || "Failed to send request");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending request");
    } finally {
      setSendingRequest(false);
    }
  }

  const handleDeleteClick = async () => {
    try {
      dispatch(deletePrivateMessage(selectedMessage));
      setSelectedMessage(null);
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
        inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value?.length;
      }
    }, 0);
  };

  const handleReplyClick = (msg) => {
    setReplyTo(msg);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value?.length;
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

  const handleDownload = (msg) => {
    setDownloadedFiles(prev => ({
      ...prev,
      [msg.id]: { loading: true }
    }));

    setTimeout(() => {
      setDownloadedFiles(prev => ({
        ...prev,
        [msg.id]: { loading: false, url: msg.fileUrl }
      }));
    }, 2000);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleWhatsappNotify = async () => {
    setLoadingWANoti("loading");
    try {
      const response = await whatsappNotify(id, token);
      if (response.data.status === 'success') {
        setLoadingWANoti("done");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong while sending whatsapp notification";
      toast.error(errorMessage, { autoClose: 3000 });

      setLoadingWANoti("idle");
    }
  }

  // Click outside events
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }

      if (event.key === "Escape") setShowEmojiPicker(false);

      if (actionModalRef.current && !actionModalRef.current.contains(event.target)) {
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
    document.addEventListener("keydown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleClickOutside);
    };
  }, []);

  // useEffect(() => {
  //   const handleKey = (e) => {
  //     if (e.key === "Escape") setShowEmojiPicker(false);
  //   };
  //   document.addEventListener("keydown", handleKey);
  //   return () => document.removeEventListener("keydown", handleKey);
  // }, []);


  return (
    <div className="min-h-screen bg-gradient-to-tr from-white to-indigo-50 p-4">
      <div className="relative w-full max-w-md mx-auto flex flex-col h-[86vh] sm:h-[95vh] px-2 sm:px-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-indigo-600 hover:underline text-sm"
          >
            ← Back
          </button>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 max-w-[12rem] truncate">
            {name?.split(' ')[0]}
          </h2>
          {loadingWANoti === "idle" ? (
            <button
              onClick={handleWhatsappNotify}
              title="Notify via WhatsApp"
              className="text-gray-500 hover:text-green-600 transition p-1 rounded-full"
            >
              <BsBellFill className="w-5 h-5" />
            </button>
          ) : loadingWANoti === "loading" ? (
            <div
              className="w-5 h-5 border-2 border-t-2 border-green-500 border-t-transparent rounded-full animate-spin"
              title="Sending WhatsApp notification..."
            />
          ) : (
            <BsBellSlashFill
              className="w-5 h-5 text-gray-500"
              title="Notification disabled"
            />
          )}
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
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-10 space-y-2">
              <HiOutlineChat className="text-3xl text-indigo-400" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-gray-400">Send a message to start the conversation</p>
            </div>
          ) : (

            messages.map((msg, i) => {
              const isSender = msg.senderId === loggedInUserId;
              const currentDate = formatDate(msg?.createdAt);
              const prevDate = i > 0 ? formatDate(messages[i - 1]?.createdAt) : null;
              const userReaction = msg?.reactions?.find(r => r.userId === loggedInUserId);
              msgCount += 1;
              return (
                <React.Fragment key={msg.id}>
                  {msg.id === firstUnreadMessageId && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center my-4"
                    >
                      <div className="flex items-center gap-2 w-full max-w-xs px-4">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="text-xs text-gray-500 whitespace-nowrap px-3 py-0.5 rounded-full">
                          New Messages
                        </span>
                        <div className="flex-1 border-t border-gray-300"></div>
                      </div>
                    </motion.div>
                  )}

                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                    prevDate={prevDate !== currentDate ? currentDate : null}
                    isSender={isSender}
                    msgCount={msgCount}
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
                    formatFullTimestamp={formatFullTimestamp}
                    selectedMessage={selectedMessage}
                    setSelectedMessage={setSelectedMessage}
                    loggedInUserId={loggedInUserId}
                    downloadedFile={downloadedFiles[msg.id]}
                    onDownload={() => handleDownload(msg)}
                    notFriend={notFriend}
                  />
                </React.Fragment>
              );
            })
          )}

          {notifyNewMessage && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 left-4 text-white bg-white rounded-full shadow-md transition-all z-50 flex animate-bounce"
            >
              {friend?.profileImageUrl ? (
                <img
                  src={friend?.profileImageUrl}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border"
                />
              ) : (
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                  {friend?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <HiChevronDown className="text-indigo-400 rounded-full text-lg mt-1 drop-shadow-sm" />
            </button>
          )}
        </div>

        {selectedMessage && selectedMessage.mode !== "edit" && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-xl shadow-xl w-72 relative" ref={actionModalRef}>
              {/* Close Icon */}
              <button
                onClick={() => setSelectedMessage(null)}
                className="absolute top-3 right-3 rounded-md text-gray-500 hover:bg-gray-50 transition"
                title="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-sm font-medium text-gray-700 mb-4">Choose Action</h3>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSeenModalData({
                      msg: selectedMessage,
                      message: selectedMessage.message || "📎 File",
                      time: formatTime(selectedMessage.createdAt),
                      senderName: selectedMessage.sender?.name,
                      fileType: selectedMessage.fileType,
                    });
                    setSelectedMessage(null);
                  }}
                  className="w-14 text-teal-600 text-sm bg-teal-50 hover:bg-teal-100 rounded-md py-1 transition"
                >
                  Info
                </button>

                <button
                  onClick={() => {
                    handleEditClick(selectedMessage);
                    setSelectedMessage(null);
                  }}
                  className="w-14 text-indigo-600 text-sm bg-indigo-50 hover:bg-indigo-100 rounded-md py-1 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-14 text-red-500 text-sm bg-red-50 hover:bg-red-100 rounded-md py-1 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seen by modal */}
        {seenModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm relative">
              <button
                onClick={() => setSeenModalData(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl"
              >
                &times;
              </button>

              {/* Modal Header */}
              <h2 className="text-xl font-semibold text-indigo-700 mb-3 text-center">
                Message Seen Info
              </h2>

              {/* Message box display */}
              <div className={`flex justify-end relative`}>
                <div className='mb-2 p-3 rounded-xl text-sm shadow-md break-words whitespace-pre-wrap relative bg-indigo-100 self-end max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent'>
                  <div className="text-left">
                    {/* text message */}
                    {!seenModalData.fileType && (
                      <div>{seenModalData.message}</div>
                    )}

                    {/* image or video icon */}
                    {seenModalData.fileType && (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        {seenModalData.fileType === "image" ? (
                          <HiPhotograph className="w-8 h-8 mb-1" />
                        ) : (
                          <HiVideoCamera className="w-8 h-8 mb-1" />
                        )}
                        <span className="text-xs italic">File</span>
                      </div>
                    )}
                  </div>

                  {/* time, edited, ticks */}
                  <div className={`flex items-center mt-1 justify-end`}>
                    <div className="text-[10px] pr-0 text-gray-400 text-right flex items-center gap-1">
                      {seenModalData.time}{" "}
                      {!!seenModalData.msg.isEdited && <span className="italic">(edited)</span>}
                      <span style={{ color: seenModalData.msg.isRead ? "#3B82F6" : "#9CA3AF" }}>
                        {seenModalData.msg.isRead ? (
                          <BsCheckAll className="inline-block w-4 h-4" />
                        ) : (
                          <BsCheck className="inline-block w-4 h-4" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seperator Line */}
              <div className="border-t border-gray-300 my-4"></div>

              {/* Seen / Not Seen */}
              <div className="mb-4">
                <h3 className={`text-sm font-semibold ${seenModalData.msg.isRead ? 'text-green-700' : 'text-red-700'}  mb-1`}>
                  {seenModalData.msg?.isRead ? 'Seen : ' : 'Not Seen Yet'}
                  {seenModalData.msg?.isRead && seenModalData.msg?.readAt && (
                    <span className="text-xs text-gray-600 font-normal italic ml-1">
                      {formatRelativeTime(seenModalData.msg?.readAt)}
                    </span>
                  )}
                </h3>
              </div>

              {/* Close button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSeenModalData(null)}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-0 h-4">
          {isTyping ? (
            <div className="flex flex-col items-left px-3">
              <div className="flex space-x-1">
                <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          ) : "\u00A0"}
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

          {notFriend && (
            <div className="flex flex-col items-center justify-center text-gray-500 mb-2 space-y-2">
              <p className="text-sm text-center">
                You're not friends currently — send a request to connect
              </p>
              {sendingRequest ? (
                <div className="flex flex-col items-center mt-2 pt-4">
                  <div className="flex space-x-1">
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={sendReq}
                  disabled={requestSent}
                  className={`px-3 py-1 rounded-md text-sm transition duration-300 ${requestSent
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                    }`}
                >
                  {requestSent ? "Request Sent" : "Send Request"}
                </button>
              )}
            </div>
          )}



          <div className={notFriend ? "pointer-events-none opacity-50" : ""}>
            {selectedFile && (
              <div className="flex items-center justify-between bg-gray-50 border rounded p-2 mb-2">
                <div className="text-xs text-gray-700 truncate max-w-[200px]">
                  📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 text-xs hover:underline ml-2"
                >
                  Remove
                </button>
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2 bg-white p-2 mb-2.5 rounded-lg shadow-sm"
            >

              {/* Emoji Button */}
              <button
                // disabled={notFriend || isSubmitting}
                disabled={notFriend}
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
              {/* Textarea */}
              <textarea
                // disabled={notFriend || isSubmitting}
                disabled={notFriend}
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
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none min-h-[2.5rem] max-h-[5rem] overflow-y-auto"
                autoComplete="off"
                rows={1}
              />

              {/* File attachment */}
              {!editMode && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    // disabled={notFriend || isSubmitting}
                    disabled={notFriend}
                    onClick={() => fileInputRef.current.click()}
                    className="text-gray-500 hover:text-indigo-500"
                    title="Attach File"
                  >
                    <HiPaperClip className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Send Button */}
              <button
                type="submit"
                // disabled={notFriend || isSubmitting}
                disabled={notFriend}
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
    </div >
  );
}