import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    getFriends,
    getUnreadMessages,
    getGroups,
    getUnreadGroupMessages,
    createGroup,
    deleteGroup,
    unFriend,
} from "../../api";
import { motion } from "framer-motion";
import useSocket from "../../hooks/useSocket";

export default function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem("jwt");

    const [friends, setFriends] = useState([]);
    const [user, setUser] = useState(null);
    const [unreadMap, setUnreadMap] = useState({});
    const [groups, setGroups] = useState([]);
    const [unreadGroupMap, setUnreadGroupMap] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedFriendIds, setSelectedFriendIds] = useState([]);
    const [activeMenuGroupId, setActiveMenuGroupId] = useState(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    const [activeFriendMenuId, setActiveFriendMenuId] = useState(null);
    const [confirmUnfriendId, setConfirmUnfriendId] = useState(null);

    const groupRefs = useRef({});
    const friendRefs = useRef({});

    // Use socket globally just for notifications
    useSocket({
        token,
        chatUserId: null,
        groupId: null,
        loggedInUserId: null,
        setMessages: null,
        setIsTyping: null,
        onNewMessageAlert: (fromUserId, type, roomId) => {
            if (type === "group") {
                setUnreadGroupMap((prev) => ({
                    ...prev,
                    [roomId]: true,
                }));
            } else {
                setUnreadMap((prev) => ({
                    ...prev,
                    [fromUserId]: true,
                }));
            }
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [friendsRes, unreadRes, groupsRes, unreadGroupRes] =
                    await Promise.all([
                        getFriends(token),
                        getUnreadMessages(token),
                        getGroups(token),
                        getUnreadGroupMessages(token),
                    ]);

                if (friendsRes.data.status !== "success") {
                    toast.error(
                        friendsRes.data.message || "Could not retrieve friends",
                        { autoClose: 3000 }
                    );
                } else {
                    setFriends(friendsRes.data.data.data);
                    setUser(friendsRes.data.data.user);
                }

                if (unreadRes.data.status === "success") {
                    setUnreadMap(unreadRes.data.data || {});
                }

                if (groupsRes.data.status === "success") {
                    setGroups(groupsRes.data.data || []);
                }

                if (unreadGroupRes.data.status === "success") {
                    setUnreadGroupMap(unreadGroupRes.data.data || {});
                }
            } catch (error) {
                const errorMessage =
                    error.response?.data?.message ||
                    "Something went wrong while fetching data";

                if (errorMessage === "Invalid or expired token") {
                    toast.error("Invalid session. Please log in again.", {
                        autoClose: 3000,
                    });
                    localStorage.removeItem("jwt");
                    navigate("/");
                } else {
                    toast.error(errorMessage, { autoClose: 3000 });
                }
            }
        };
        
        fetchData();
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("jwt");
        toast.success("Logged out", { autoClose: 3000 });
        navigate("/");
    };

    const handleUserClick = (user) => {
        // Mark as read when opening chat
        setUnreadMap((prev) => {
            const updated = { ...prev };
            delete updated[user.id];
            return updated;
        });

        navigate(`/chatbox/${user.id}?name=${encodeURIComponent(user.name)}`);
    };

    const handleGroupClick = (group) => {
        setUnreadGroupMap((prev) => {
            const updated = { ...prev };
            delete updated[group.id];
            return updated;
        });

        navigate(
            `/groupchatbox/${group.id}?name=${encodeURIComponent(group.name)}`,
            { state: { friends } }
        );
    };

    const goToFindPeople = () => {
        navigate("/find-people");
    };

    const goToFriendRequests = () => {
        navigate("/friend-requests");
    };

    const handleUnfriend = async (friendId) => {
        try {
            const res = await unFriend(friendId, token);

            if (res.data.status === "success") {
                toast.success("Friend removed!");
                setFriends((prev) => prev.filter((f) => f.id !== friendId));
            } else {
                toast.error(res.data.message || "Failed to unfriend");
            }
        } catch (err) {
            toast.error("Error unfriending user");
        }
    };

    // Create group logic handler
    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            return toast.error("Group name is required");
        }

        if (groupName.length > 20) {
            return toast.error("Group name too long");
        }

        if (selectedFriendIds.length === 0) {
            return toast.error("Select at least one friend");
        }

        try {
            const res = await createGroup(
                { name: groupName.trim(), memberIds: selectedFriendIds },
                token
            );

            if (res.data.status === "success") {
                // toast.success("Group created!");
                setShowCreateModal(false);
                setGroupName("");
                setSelectedFriendIds([]);

                // Refresh groups
                const refreshed = await getGroups(token);
                if (refreshed.data.status === "success") {
                    setGroups(refreshed.data.data || []);
                }
            } else {
                toast.error(res.data.message || "Could not create group");
            }
        } catch (err) {
            toast.error("Error creating group");
        }
    };

    // Handle group deletion
    const handleDeleteGroup = async (groupId) => {
        try {
            const res = await deleteGroup(groupId, token);
            if (res.data.status === "success") {
                toast.success("Group deleted!");
                setGroups((prev) => prev.filter((g) => g.id !== groupId));
            } else {
                toast.error(res.data.message || "Failed to delete group");
            }
        } catch (err) {
            toast.error("Error deleting group");
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            // Close group menu if click is outside
            if (
                activeMenuGroupId &&
                groupRefs.current[activeMenuGroupId] &&
                !groupRefs.current[activeMenuGroupId].contains(event.target)
            ) {
                setActiveMenuGroupId(null);
            }

            // Close friend menu if click is outside
            if (
                activeFriendMenuId &&
                friendRefs.current[activeFriendMenuId] &&
                !friendRefs.current[activeFriendMenuId].contains(event.target)
            ) {
                setActiveFriendMenuId(null);
            }
        }

        // Delay binding the listener to next tick to ensure refs are populated
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activeMenuGroupId, activeFriendMenuId]);

    return (
        <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-white px-4">
            <div className="max-w-4xl mx-auto relative min-h-screen py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-indigo-700">
                            {user
                                ? `Welcome Back ${
                                      user?.name.trim().split(" ")[0]
                                  }!`
                                : "Welcome Back!"}
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-base">
                            Stay connected and chat with your friends
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={goToFindPeople}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-base"
                        >
                            🔍 Find People
                        </button>
                        <button
                            onClick={goToFriendRequests}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-base"
                        >
                            📨 Friend Requests
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-base"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Friends List */}
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Your Friends:
                </h2>

                {friends.length === 0 ? (
                    <p className="text-center text-gray-500 mt-10">
                        No friends yet. Send some requests!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                        {friends.map((user, index) => (
                            <motion.div
                                key={user.id}
                                className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-300 relative"
                                title={`Chat with ${user.name}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                {/* Friend Info */}
                                <div
                                    onClick={() => handleUserClick(user)}
                                    className="flex items-center space-x-4 cursor-pointer"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {user.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* ⋮ Friend Options Button */}
                                <div
                                    className="absolute top-2 right-2"
                                    ref={(el) => {
                                        if (el)
                                            friendRefs.current[user.id] = el;
                                    }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFriendMenuId((prev) =>
                                                prev === user.id
                                                    ? null
                                                    : user.id
                                            );
                                        }}
                                        className="text-gray-500 hover:text-gray-800 text-lg"
                                    >
                                        ⋮
                                    </button>

                                    {activeFriendMenuId === user.id && (
                                        <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-md z-50">
                                            <button
                                                onClick={() => {
                                                    setConfirmUnfriendId(
                                                        user.id
                                                    );
                                                    setActiveFriendMenuId(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Unfriend
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 🔴 Unread Indicator */}
                                {unreadMap[user.id] && (
                                    <span className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-bounce"></span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Groups List */}
                {groups.length > 0 && (
                    <>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">
                            Your Groups:
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
                            {groups.map((group, index) => (
                                <motion.div
                                    key={group.id}
                                    className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-300 relative"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div
                                        onClick={() => handleGroupClick(group)}
                                        className="cursor-pointer flex items-center space-x-4"
                                        title={`Enter group ${group.name}`}
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-lg">
                                            {group.name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="max-w-[10rem]">
                                            <p className="font-medium text-gray-800 break-words leading-snug">
                                                {group.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Group Chat
                                            </p>
                                        </div>
                                    </div>

                                    {/* ⋮ Menu Toggle */}
                                    <div
                                        className="absolute top-2 right-2"
                                        ref={(el) => {
                                            if (el)
                                                groupRefs.current[group.id] =
                                                    el;
                                        }}
                                    >
                                        <button
                                            className="text-gray-500 hover:text-gray-800 text-lg"
                                            onClick={(e) => {
                                                e.stopPropagation(); // ⛔ Stop bubbling to window
                                                setActiveMenuGroupId((prev) =>
                                                    prev === group.id
                                                        ? null
                                                        : group.id
                                                );
                                            }}
                                        >
                                            ⋮
                                        </button>

                                        {activeMenuGroupId === group.id && (
                                            <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-md z-50">
                                                <button
                                                    onClick={() => {
                                                        setConfirmingDeleteId(
                                                            group.id
                                                        );
                                                        setActiveMenuGroupId(
                                                            false
                                                        );
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 🔴 Unread Indicator */}
                                    {unreadGroupMap[group.id] && (
                                        <span className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-bounce"></span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {/* Floating + Button aligned to container but fixed on screen */}
            <div className="fixed bottom-6 left-1/2 w-full max-w-4xl px-4 transform -translate-x-1/2 flex justify-end z-50">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-2xl w-14 h-14 rounded-full shadow-lg transition duration-300"
                    title="Create Group"
                >
                    +
                </button>
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4 text-indigo-700">
                            Create New Group
                        </h2>

                        <input
                            type="text"
                            placeholder="Group Name"
                            className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />

                        <div className="mb-4 max-h-40 overflow-y-auto">
                            <p className="mb-2 text-sm font-medium text-gray-700">
                                Select Friends:
                            </p>
                            {friends.map((f) => (
                                <label
                                    key={f.id}
                                    className="flex items-center space-x-2 mb-1 text-sm text-gray-800"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedFriendIds.includes(
                                            f.id
                                        )}
                                        onChange={(e) =>
                                            setSelectedFriendIds((prev) =>
                                                e.target.checked
                                                    ? [...prev, f.id]
                                                    : prev.filter(
                                                          (id) => id !== f.id
                                                      )
                                            )
                                        }
                                    />
                                    <span>{f.name}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm rounded-md bg-gray-300 hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {confirmingDeleteId && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-5 shadow-lg max-w-sm w-full text-center">
                        <p className="text-gray-800 font-medium mb-4">
                            Are you sure you want to delete this group?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => {
                                    setConfirmingDeleteId(false);
                                    setActiveMenuGroupId(false);
                                }}
                                className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleDeleteGroup(confirmingDeleteId);
                                    setConfirmingDeleteId(false);
                                }}
                                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {confirmUnfriendId && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-5 shadow-lg max-w-sm w-full text-center">
                        <p className="text-gray-800 font-medium mb-4">
                            Are you sure you want to unfriend this person?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setConfirmUnfriendId(null)}
                                className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleUnfriend(confirmUnfriendId);
                                    setConfirmUnfriendId(null);
                                }}
                                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                            >
                                Unfriend
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
