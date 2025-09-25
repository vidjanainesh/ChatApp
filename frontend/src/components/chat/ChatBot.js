import React, { useEffect, useState, useRef, useCallback } from "react";
import ChatBotMessage from "./ChatBotMessage";
import { useParams, useNavigate } from "react-router-dom";
import { getMessagesBot, sendMessageBot } from "../../api";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import { useDispatch, useSelector } from "react-redux";
import { clearMessages, clearChatState, prependBotMessages, setBotMessages, addBotMessage, updateBotMessageId } from "../../store/chatSlice";
import { HiOutlineChat, HiChevronDown, HiArrowLeft } from "react-icons/hi";
import { v4 as uuidv4 } from 'uuid';

import { formatDate, formatTime, formatFullTimestamp } from "../../helper/formatDateAndTime";

export default function ChatBot() {
    const navigate = useNavigate();
    const { id } = useParams();

    const token = localStorage.getItem("jwt");

    const chatWindowRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const hasInitScrolled = useRef(false);
    const lastMessageId = useRef(null);
    const isInitialLoad = useRef(true);

    const dispatch = useDispatch();
    const messages = useSelector((state) => state.chat.botMessages);

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

    const [input, setInput] = useState("");
    // const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messageLoading, setMessageLoading] = useState(true);
    // const [replyTo, setReplyTo] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [firstUnreadMessageId, setFirstUnreadMessageId] = useState(null);
    const [notifyNewMessage, setNotifyNewMessage] = useState(false);


    const socketRef = useSocket({
        token,
        chatUserId: id,
        loggedInUserId,
        setIsTyping,
    });

    // useEffect(() => {
    //     console.log("Messages: ", messages);
    // }, [messages])

    // Function to fetch messages
    const fetchMessages = useCallback(async (beforeId = null) => {
        if (beforeId) {
            setLoadingOlder(true);
        } else {
            setMessageLoading(true);
        }
        try {
            const res = await getMessagesBot(beforeId, token);
            if (res.data.status === "success") {
                const newMessages = res.data.data;

                if (beforeId) {
                    if (newMessages?.length < 4) setHasMore(false);
                    dispatch(prependBotMessages(newMessages));
                } else {
                    dispatch(setBotMessages(newMessages));
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
    }, [token, dispatch, navigate]);

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
        // if (socketRef) {
        //     socketRef.emit("typing", {
        //         senderId: loggedInUserId,
        //         receiverId: parseInt(id),
        //         isTyping: true,
        //     });

        //     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        //     typingTimeoutRef.current = setTimeout(() => {
        //         socketRef.emit("typing", {
        //             senderId: loggedInUserId,
        //             receiverId: parseInt(id),
        //             isTyping: false,
        //         });
        //     }, 1000);
        // }
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        if (!input.trim()) return;

        // setIsSubmitting(true);
        setInput("");       // clear input
        setIsTyping(true);
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 100);

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
                senderId: loggedInUserId,
                senderMessage: input,
                chatbotReply: null,
                temp: true,
                // repliedMessage: replyTo ? {
                //     id: replyTo.id,
                //     message: replyTo.message,
                // } : null
            };
            // console.log("Old message: ", message)
            // setReplyTo(null);
            dispatch(addBotMessage(message));

            // For calling API and receiving the actual message object
            const formData = new FormData();
            formData.append("msg", input);
            // if (replyTo?.id) formData.append("replyTo", replyTo.id);

            const res = await sendMessageBot(formData, token); // API Call

            if (res.data.status === "success") {
                const realMessage = res.data.data;
                // console.log("New message: ", realMessage);
                dispatch(updateBotMessageId({ tempId, newMessage: realMessage }));
            } else {
                toast.error("Could not send message", { autoClose: 3000 });
            }

        } catch (err) {
            console.log(err)
            const msg = err.response?.data?.message || "Failed to send message";
            if (msg === "Invalid or expired token") {
                localStorage.removeItem("jwt");
                navigate("/");
            } else {
                toast.error(msg, { autoClose: 3000 });
            }
        }
        finally {
            setIsTyping(false);
            scrollToBottom();
            // setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-tr from-white to-indigo-50 p-4">
            <div className="relative w-full max-w-md mx-auto flex flex-col h-[86vh] sm:h-[95vh] px-2 sm:px-4 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="flex items-center gap-0.5 text-indigo-600"
                        >
                            <HiArrowLeft className="text-sm" />

                            <img
                                src='/chatbot.png'
                                alt="Avatar"
                                className="w-9 h-9 rounded-full object-contain p-1"
                            />
                            {/* <div className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                                    {friend?.name?.charAt(0).toUpperCase()}
                                </div> */}
                        </button>
                        <h2
                            className="text-lg sm:text-xl font-semibold text-gray-800 max-w-[16rem] truncate cursor-pointer"
                            // onClick={() => navigate(`/profile/${friend.id}`)}
                            title="Chatbot Dioc"
                        >
                            Dioc
                        </h2>
                    </div>
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
                            const currentDate = formatDate(msg?.createdAt);
                            const prevDate = i > 0 ? formatDate(messages[i - 1]?.createdAt) : null;
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

                                    <ChatBotMessage
                                        key={msg.id}
                                        msg={msg}
                                        prevDate={prevDate !== currentDate ? currentDate : null}
                                        msgCount={msgCount}
                                        formatTime={formatTime}
                                        formatFullTimestamp={formatFullTimestamp}
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
                            <img
                                src='/chatbot.png'
                                alt="Avatar"
                                className="w-9 h-9 rounded-full object-contain p-1 border"
                            />
                            <HiChevronDown className="text-indigo-400 rounded-full text-lg mt-1 drop-shadow-sm" />
                        </button>
                    )}
                </div>

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

                    {/* {replyTo && (
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
                    )} */}

                    <form
                        onSubmit={handleSubmit}
                        className="relative flex items-center gap-2 bg-white p-2 mb-2.5 rounded-lg shadow-sm"
                    >
                        {/* Textarea */}
                        <textarea
                            // disabled={isSubmitting}
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

                        {/* Send Button */}
                        <button
                            type="submit"
                            // disabled={isSubmitting}
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
        </div >
    );
}