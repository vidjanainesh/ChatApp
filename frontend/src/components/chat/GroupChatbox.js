import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
    getGroupData,
    sendGroupMessage,
    joinGroup,
    leaveGroup,
    deleteGroupMessage,
    editGroupMessage,
    deleteReactions,
    reactMessage,
} from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";
import { useDispatch, useSelector } from "react-redux";
import GroupChatMessage from "./GroupChatMessage";
import {
    setGroupMessages,
    setGroupMembers,
    deleteGroupMsgAction,
    editGroupMsgAction,
    clearGroupMessages,
    clearChatState,
    addReactionToGroupMessage,
    setCurrentChat,
    prependGroupMessages,
} from "../../store/chatSlice";
import EmojiPicker from "emoji-picker-react";
import { HiOutlineLogout, HiUserAdd, HiOutlineUsers, HiOutlineChat } from "react-icons/hi";
import { setGroups } from "../../store/userSlice";

export default function GroupChatbox() {
    const navigate = useNavigate();
    const { id } = useParams(); // groupId
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const name = queryParams.get("name");
    const token = localStorage.getItem("jwt");

    const dispatch = useDispatch();
    const messages = useSelector((state) => state.chat.groupMessages);
    const members = useSelector((state) => state.chat.groupMembers);
    const friends = useSelector((state) => state.user.friends);
    const groups = useSelector((state) => state.user.groups);

    const [input, setInput] = useState("");
    const [editMode, setEditMode] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [messageLoading, setMessageLoading] = useState(true);
    const [showMembers, setShowMembers] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [reactionPickerId, setReactionPickerId] = useState(null);
    const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];
    const [showFullEmojiPickerId, setShowFullEmojiPickerId] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [firstLoadDone, setFirstLoadDone] = useState(false);
    const hasInitScrolled = useRef(false);

    const emojiRef = useRef(null);
    const membersDropdownRef = useRef(null);
    const chatWindowRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const leaveModalRef = useRef(null);
    const inviteModalRef = useRef(null);
    const reactionPickerRef = useRef();
    const fullReactionPickerRef = useRef();
    const inputRef = useRef(null);

    let msgCount = -1;

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

    const socketRef = useSocket({
        token,
        groupId: id,
        loggedInUserId,
        setIsTyping,
    });

    const fetchGroupMessages = useCallback(async (beforeId = null) => {
        if (beforeId) {
            setLoadingOlder(true);
        } else {
            setMessageLoading(true);
        };

        dispatch(setCurrentChat({ id, type: "group" }));
        try {
            const res = await getGroupData(id, token, beforeId);
            if (res.data.status === "success") {
                const newMessages = res.data.data.messages;

                if (beforeId) {
                    if (newMessages.length < 9) setHasMore(false);
                    dispatch(prependGroupMessages(newMessages));
                    dispatch(setGroupMembers(res.data.data.members.members));
                } else {
                    dispatch(setGroupMessages(newMessages));
                    dispatch(setGroupMembers(res.data.data.members.members));
                    setFirstLoadDone(true);
                }
            } else {
                toast.error(
                    res.data.message || "Failed to get group messages",
                    { autoClose: 3000 }
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
        } finally {
            if (beforeId) {
                setLoadingOlder(false);
            } else {
                setMessageLoading(false);
            }
        }
    }, [id, token, dispatch, navigate]);

    useEffect(() => {
        dispatch(clearGroupMessages());
        fetchGroupMessages();
    }, [id, fetchGroupMessages, dispatch]);

    useEffect(() => {
        return () => {
            dispatch(clearChatState()); // ✅ this clears messages, groupMessages, currentChat, etc.
        };
    }, [dispatch]);

    // Infinite scroll: load older and maintain position
    useEffect(() => {
        const handleScroll = () => {
            if (!chatWindowRef.current || !hasMore) return;

            if (chatWindowRef.current.scrollTop === 0) {
                const oldestMsgId = messages[0]?.id;
                if (oldestMsgId) {
                    chatWindowRef.current.previousScrollHeight = chatWindowRef.current.scrollHeight;
                    fetchGroupMessages(oldestMsgId);
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
    }, [messages, hasMore, fetchGroupMessages]);

    // 1. Initial load scroll
    useEffect(() => {
        if (!messageLoading && messages.length && chatWindowRef.current) {
            if (!hasInitScrolled.current) {
                chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
                hasInitScrolled.current = true;
            }
        }
    }, [messageLoading, messages]);

    const lastMessageId = useRef(null);

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

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (socketRef) {
            socketRef.emit("groupTyping", {
                senderId: loggedInUserId,
                groupId: parseInt(id),
                isTyping: true,
            });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                socketRef.emit("groupTyping", {
                    senderId: loggedInUserId,
                    groupId: parseInt(id),
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
                const res = await editGroupMessage(editMode.id, input, token);
                if (res.data.status === "success") {
                    dispatch(editGroupMsgAction(res.data.data));
                    setEditMode(null);  // exit edit mode
                    setInput("");       // clear input
                    setReplyTo(null);
                }
            } catch {
                toast.error("Failed to edit message");
            }
        } else {
            socketRef.emit("groupTyping", {
                senderId: loggedInUserId,
                groupId: parseInt(id),
                isTyping: false,
            });
            try {
                const res = await sendGroupMessage(
                    { groupId: parseInt(id), msg: input, replyTo: replyTo?.id || null },
                    token
                );
                if (res.data.status === "success") {
                    setInput("");
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

    const handleDeleteClick = async (id) => {
        try {
            const res = await deleteGroupMessage(id, token);
            if (res.data.status === "success") {
                dispatch(deleteGroupMsgAction(res.data.data));
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
                const response = await reactMessage(messageId, {
                    targetType: "group",
                    reaction: emoji,
                }, token);

                dispatch(addReactionToGroupMessage({
                    messageId: response.data.data.messageId,
                    reaction: response.data.data,
                }));
            }
        } catch (err) {
            toast.error("Failed to react to message");
        } finally {
            setReactionPickerId(null);
            setShowFullEmojiPickerId(null);
        }
    };


    const handleClickOutside = (event) => {
        if (emojiRef.current && !emojiRef.current.contains(event.target)) {
            setShowEmojiPicker(false);
        }

        if (
            membersDropdownRef.current &&
            !membersDropdownRef.current.contains(event.target)
        ) {
            setShowMembers(false);
        }

        if (
            leaveModalRef.current &&
            !leaveModalRef.current.contains(event.target)
        ) {
            setShowLeaveModal(false);
        }

        if (
            inviteModalRef.current &&
            !inviteModalRef.current.contains(event.target)
        ) {
            setShowInviteModal(false);
        }

        if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
            setReactionPickerId(null);
        }

        if (fullReactionPickerRef.current && !fullReactionPickerRef.current.contains(event.target)) {
            setShowFullEmojiPickerId(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLeaveGroup = async () => {
        try {
            const res = await leaveGroup(id, token);
            if (res.data.status === "success") {
                toast.success("You left the group");
                setTimeout(() => {
                    dispatch(setGroups(groups.filter((g) => g.id !== parseInt(id))));
                    dispatch(setGroupMembers(members.filter((m) => m.id !== loggedInUserId)))
                    navigate("/dashboard");
                }, 0);
            } else {
                toast.error(res.data.message || "Failed to leave group");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Error leaving group";
            toast.error(msg);
        }
    };

    const handleInviteMultiple = async (friendIds) => {
        try {
            const res = await joinGroup(
                { groupId: parseInt(id), friendIds },
                token
            );
            if (res.data.status === "success") {
                // toast.success("Friends added to group");
                // fetchGroupMessages(); // refresh members
            } else {
                toast.error(res.data.message || "Could not add friends");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Error adding friends";
            toast.error(msg);
        }
    };

    const formatTime = (ts) =>
        new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
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

    const getMinWidth = (msg) => {
        if (!msg.reactions || msg.reactions?.length === 0) return "0px";

        // Unique emojis (reaction groups)
        const uniqueEmojis = Object.keys(
            msg.reactions.reduce((acc, reaction) => {
                acc[reaction.reaction] = true;
                return acc;
            }, {})
        );

        const numReactions = uniqueEmojis.length;

        // Each reaction button roughly takes ~28px + 4px gap
        const buttonWidthWithGap = 32;

        // Total width required by reactions
        const totalReactionsWidth = numReactions * buttonWidthWithGap;

        // Ensure minimum width (e.g. for text bubbles like "Hi")
        return `${Math.max(60, totalReactionsWidth)}px`;
    };

    const getMaxWidth = (msg) => {
        if (!msg.reactions || msg.reactions.length === 0) return "75%";

        const uniqueEmojis = Object.keys(
            msg.reactions.reduce((acc, reaction) => {
                acc[reaction.reaction] = true;
                return acc;
            }, {})
        );

        const buttonWidthWithGap = 32;
        const totalWidth = uniqueEmojis.length * buttonWidthWithGap;

        // E.g. if 6 reactions need ~192px, allow up to that
        const minAllowed = Math.max(150, totalWidth + 20); // +20 for padding

        // Cap to 90% so it doesn't exceed chat width
        return `min(${minAllowed}px, 90%)`;
    };


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

                    <div className="flex items-center gap">
                        {/* Leave Button */}
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="p-1.5 rounded hover:bg-red-100 text-red-500 hover:text-red-600"
                            title="Leave Group"
                        >
                            <HiOutlineLogout className="w-5 h-5" />
                        </button>
                        {/* 👥 Button aligned right */}
                        <div className="relative" ref={membersDropdownRef}>
                            <button
                                onClick={() => setShowMembers((prev) => !prev)}
                                className="p-1.5 rounded hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800"
                                title="View Members"
                            >
                                <HiOutlineUsers className="w-5 h-5" />
                            </button>

                            {showMembers && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="flex items-center justify-between px-4 py-2 font-semibold text-gray-700 border-b">
                                        <span>Group Members</span>
                                        <button
                                            onClick={() => {
                                                setShowInviteModal(true);
                                                setShowMembers(false); // optional: auto-close dropdown
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                                            title="Invite Friends"
                                        >
                                            <HiUserAdd className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <ul className="max-h-50 overflow-y-auto divide-y divide-gray-100">
                                        {members.map((member) => {
                                            const isCurrentUser =
                                                member.id === loggedInUserId;
                                            return (
                                                <li
                                                    key={member.id}
                                                    onClick={() => !isCurrentUser && navigate(`/chatbox/${member.id}?name=${encodeURIComponent(member.name)}`)}
                                                    className={`px-4 py-3 transition ${isCurrentUser
                                                        ? "cursor-default bg-gray-50"
                                                        : "cursor-pointer hover:bg-indigo-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm uppercase">
                                                            {member.name
                                                                .split(" ")
                                                                .map(
                                                                    (n) => n[0]
                                                                )
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
                            if (msg.type !== "system") msgCount += 1;

                            return (
                                <GroupChatMessage
                                    key={msg.id}
                                    msg={msg}
                                    i={i}
                                    isSender={isSender}
                                    prevDate={prevDate}
                                    currentDate={currentDate}
                                    msgCount={msgCount}
                                    loggedInUserId={loggedInUserId}
                                    reactionPickerId={reactionPickerId}
                                    setReactionPickerId={setReactionPickerId}
                                    showFullEmojiPickerId={showFullEmojiPickerId}
                                    setShowFullEmojiPickerId={setShowFullEmojiPickerId}
                                    handleReact={handleReact}
                                    onReply={handleReplyClick}
                                    handleEditClick={handleEditClick}
                                    setSelectedMessage={setSelectedMessage}
                                    getUserColor={getUserColor}
                                    getMinWidth={getMinWidth}
                                    getMaxWidth={getMaxWidth}
                                    formatTime={formatTime}
                                    reactionPickerRef={reactionPickerRef}
                                    fullReactionPickerRef={fullReactionPickerRef}
                                    availableReactions={availableReactions}
                                />
                            );
                        })
                    )}
                </div>
                {selectedMessage && selectedMessage.mode !== "edit" && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-xl shadow-xl w-72">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Choose Action</h3>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => {
                                        handleEditClick(selectedMessage);
                                        setSelectedMessage(null);
                                    }}
                                    className="text-indigo-600 text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(selectedMessage.id)}
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
                    {isTyping ? "Someone is typing..." : "\u00A0"}
                </div>

                <div className="relative" ref={emojiRef}>
                    {showEmojiPicker && (
                        <div
                            className="absolute bottom-16 left-2 z-50 origin-bottom-left"
                            style={{ transform: "scale(0.8)" }}
                        >
                            <EmojiPicker
                                onEmojiClick={(emojiData) =>
                                    setInput((prev) => prev + emojiData.emoji)
                                }
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
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="text-gray-500 hover:text-indigo-500"
                            title="Insert Emoji"
                            style={{ transform: "scale(1.3)" }}
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
                {showLeaveModal && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                        <div
                            ref={leaveModalRef}
                            className="bg-white p-6 rounded-lg shadow-lg w-80"
                        >
                            <h2 className="text-lg font-semibold mb-3 text-gray-800">
                                Leave Group?
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to leave{" "}
                                <strong>{name}</strong>?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowLeaveModal(false)}
                                    className="px-3 py-1 rounded text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        await handleLeaveGroup();
                                        setShowLeaveModal(false);
                                    }}
                                    className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                        <div
                            ref={inviteModalRef}
                            className="bg-white p-6 rounded-lg shadow-lg w-[20rem] max-h-[80vh] overflow-y-auto"
                        >
                            <h2 className="text-lg font-semibold mb-3 text-gray-800">
                                Invite Friends
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Select friends to add to the group:
                            </p>

                            {friends.filter(
                                (f) => !members.some((m) => m.id === f.id)
                            ).length > 0 ? (
                                <ul className="divide-y">
                                    {friends
                                        .filter(
                                            (f) =>
                                                !members.some(
                                                    (m) => m.id === f.id
                                                )
                                        )
                                        .map((friend) => (
                                            <li
                                                key={friend.id}
                                                className="py-2 flex items-center gap-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFriends.includes(
                                                        friend.id
                                                    )}
                                                    onChange={(e) => {
                                                        const checked =
                                                            e.target.checked;
                                                        setSelectedFriends(
                                                            (prev) =>
                                                                checked
                                                                    ? [
                                                                        ...prev,
                                                                        friend.id,
                                                                    ]
                                                                    : prev.filter(
                                                                        (
                                                                            id
                                                                        ) =>
                                                                            id !==
                                                                            friend.id
                                                                    )
                                                        );
                                                    }}
                                                />
                                                <div>
                                                    <div className="text-sm text-gray-800 font-medium">
                                                        {friend.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {friend.email}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-6">
                                    🎉 All your friends are already in the
                                    group!
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setSelectedFriends([]);
                                        setShowInviteModal(false);
                                    }}
                                    className="px-3 py-1 rounded text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (selectedFriends.length > 0) {
                                            await handleInviteMultiple(
                                                selectedFriends
                                            );
                                            setSelectedFriends([]);
                                            setShowInviteModal(false);
                                        }
                                    }}
                                    disabled={selectedFriends.length === 0}
                                    className={`px-3 py-1 rounded text-white ${selectedFriends.length > 0
                                        ? "bg-indigo-500 hover:bg-indigo-600"
                                        : "bg-indigo-300 cursor-not-allowed"
                                        }`}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}