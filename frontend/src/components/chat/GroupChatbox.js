// GroupChatbox.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getGroupMessages, sendGroupMessage } from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import { motion } from "framer-motion";

export default function GroupChatbox() {
    const navigate = useNavigate();
    const { id } = useParams(); // groupId
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const name = queryParams.get("name");
    const token = localStorage.getItem("jwt");

    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    const dropdownRef = useRef(null);
    const chatWindowRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    let loggedInUserId = null;
    try {
        const decoded = jwtDecode(token);
        loggedInUserId = decoded.id;
    } catch {
        localStorage.removeItem("jwt");
        toast.error("Invalid session. Please log in again.", {
            autoClose: 3000,
        });
        navigate("/");
    }

    const stableAlert = useCallback(() => { }, []);
    const socketRef = useSocket({
        token,
        groupId: id,
        loggedInUserId,
        setMessages,
        setIsTyping,
        onNewMessageAlert: stableAlert, // no notification while inside group chat
    });

    const fetchGroupMessages = async () => {
        try {
            const res = await getGroupMessages(id, token);
            if (res.data.status === "success") {
                setMessages(res.data.data.messages.messages);
                setMembers(res.data.data.members.members);
            } else {
                toast.error(
                    res.data.message || "Failed to get group messages",
                    {
                        autoClose: 3000,
                    }
                );
            }
        } catch (err) {
            const msg =
                err.response?.data?.message || "Error getting group messages";
            if (msg === "Invalid or expired token") {
                localStorage.removeItem("jwt");
                navigate("/");
            } else {
                toast.error(msg, { autoClose: 3000 });
            }
        }
    };

    useEffect(() => {
        fetchGroupMessages();
    }, [id]);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop =
                chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (socketRef) {
            socketRef.emit("groupTyping", {
                senderId: loggedInUserId,
                groupId: parseInt(id),
            });

            if (typingTimeoutRef.current)
                clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                socketRef.emit("groupTyping", {
                    senderId: loggedInUserId,
                    groupId: parseInt(id),
                });
            }, 1500);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        try {
            const res = await sendGroupMessage(
                { groupId: parseInt(id), msg: input },
                token
            );
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowMembers(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const formatTime = (ts) =>
        new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    const formatDate = (ts) => new Date(ts).toISOString().split("T")[0];
    function getUserColor(userId) {
        const colors = [
            "text-rose-800",
            "text-orange-800",
            "text-yellow-800",
            "text-green-800",
            "text-cyan-800",
            "text-blue-800",
            "text-violet-800",
            "text-pink-800",
            "text-teal-800",
        ];

        const index = userId % colors.length;
        return colors[index];
    }


    return (
        <div className="min-h-screen bg-gradient-to-tr from-white to-indigo-50 p-4">
            <div className="w-full max-w-md mx-auto flex flex-col h-[86vh] sm:h-[95vh] px-2 sm:px-4 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4 relative">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-indigo-600 hover:underline text-sm"
                    >
                        ← Back
                    </button>

                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[12rem] text-center mx-auto">
                        Group: {name}
                    </h2>

                    {/* 👥 Button aligned right */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowMembers((prev) => !prev)}
                            className="text-indigo-600 hover:text-indigo-800 text-lg focus:outline-none"
                            title="View Members"
                        >
                            👥
                        </button>

                        {showMembers && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="px-4 py-2 font-semibold text-gray-700 border-b">
                                    Group Members
                                </div>
                                <ul className="max-h-50 overflow-y-auto divide-y divide-gray-100">
                                    {members.map((member) => {
                                        const isCurrentUser =
                                            member.id === loggedInUserId;

                                        return (
                                            <li
                                                key={member.id}
                                                onClick={() =>
                                                    !isCurrentUser &&
                                                    navigate(
                                                        `/chatbox/${member.id
                                                        }?name=${encodeURIComponent(
                                                            member.name
                                                        )}`
                                                    )
                                                }
                                                className={`px-4 py-3 transition ${isCurrentUser
                                                    ? "cursor-default bg-gray-50"
                                                    : "cursor-pointer hover:bg-indigo-50"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm uppercase">
                                                        {member.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .slice(0, 2)
                                                            .join("")}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {isCurrentUser
                                                                ? "You"
                                                                : member.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {isCurrentUser
                                                                ? ""
                                                                : member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 px-2 pb-4 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent"
                    ref={chatWindowRef}
                >
                    {messages.map((msg, i) => {
                        const isSender = msg.senderId === loggedInUserId;
                        const currentDate = formatDate(msg.createdAt);
                        const prevDate =
                            i > 0
                                ? formatDate(messages[i - 1].createdAt)
                                : null;

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
                                    className={`flex ${isSender
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            x: isSender ? 50 : -50,
                                        }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`p-3 rounded-xl text-sm shadow-md w-fit max-w-[75%] break-words whitespace-pre-wrap 
                                            ${isSender
                                            ? "bg-indigo-100 self-end"
                                            : "bg-white self-start"
                                            }`}
                                    >
                                        {!isSender && (
                                            <div className={`text-xs font-semibold ${getUserColor(msg.senderId)} mb-1`}>
                                                {msg.sender.name?.split(" ")[0]}
                                            </div>
                                        )}
                                        <div className="text-left">
                                            {msg.message}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                                            {formatTime(msg.createdAt)}
                                        </div>
                                    </motion.div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="text-sm text-gray-500 mb-2 h-5 px-1">
                    {isTyping ? "Someone is typing..." : "\u00A0"}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex items-end gap-2 bg-white p-2 mb-2.5"
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
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none min-h-[4rem] max-h-[10rem] overflow-y-auto"
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
