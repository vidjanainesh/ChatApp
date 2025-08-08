import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiOutlineUserCircle, HiOutlineLogout, HiOutlineStatusOnline, HiOutlineInformationCircle } from "react-icons/hi";
import { HiOutlineChatBubbleLeftRight, HiOutlineUserMinus } from "react-icons/hi2";
import { FiLogOut } from "react-icons/fi";
import {
    getDashboardData,
    createGroup,
    unFriend,
    leaveGroup,
} from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import useSocket from "../../hooks/useSocket";
import { useDispatch, useSelector } from "react-redux";
import {
    setFriends,
    setUser,
    setHasFetchedDashboardData,
    setGroups,
    addGroup,
    setUnreadPrivateMap,
    setUnreadGroupMap,
    appendUnreadPrivate,
    appendUnreadGroup,
    clearUnreadPrivateMapEntry,
    clearUnreadGroupMapEntry,
    setFriendReqCount,
    clearUser,
} from "../../store/userSlice";

import { setCurrentChat, clearChatState } from "../../store/chatSlice";
import { jwtDecode } from 'jwt-decode';

export default function Dashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = localStorage.getItem("jwt");

    const user = useSelector((state) => state.user.user);
    const friends = useSelector((state) => state.user.friends);
    const onlineFriends = useSelector((state) => state.user.onlineFriends);
    const hasFetched = useSelector((state) => state.user.hasFetchedDashboardData);
    const groups = useSelector((state) => state.user.groups);
    const unreadPrivateMap = useSelector((state) => state.user.unreadPrivateMap);
    const unreadGroupMap = useSelector((state) => state.user.unreadGroupMap);
    const friendReqCount = useSelector((state) => state.user.friendReqCount);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedFriendIds, setSelectedFriendIds] = useState([]);
    const [activeMenuGroupId, setActiveMenuGroupId] = useState(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    const [activeFriendMenuId, setActiveFriendMenuId] = useState(null);
    const [confirmUnfriendId, setConfirmUnfriendId] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [leavingGroup, setLeavingGroup] = useState(false);
    const [removingFriend, setRemovingFriend] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isUserInitialized, setIsUserInitialized] = useState(false);
    const [selectedFriendForModal, setSelectedFriendForModal] = useState(null);
    const [selectedGroupForModal, setSelectedGroupForModal] = useState(null);

    const groupRefs = useRef({});
    const friendRefs = useRef({});
    const dropdownRef = useRef(null);

    // Use socket globally just for notifications
    const socketRef = useSocket({
        token,
        chatUserId: null,
        groupId: null,
        loggedInUserId: user?.id,
        setMessages: null,
        setIsTyping: null,
        onNewMessageAlert: (fromId, type) => {
            if (type === "group") {
                dispatch(appendUnreadGroup(fromId));
            } else {
                dispatch(appendUnreadPrivate(fromId));
            }
        },
    });

    useEffect(() => {
        if (!token || isUserInitialized || user) return;

        try {
            const decodedUser = jwtDecode(token);
            dispatch(setUser({ user: decodedUser, token }));
            setIsUserInitialized(true);
        } catch (error) {
            toast.error("Error setting current user");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Fetch dashboard data
    useEffect(() => {
        if (socketRef && socketRef.connected) {
            socketRef.connect();
        }
        const fetchData = async () => {
            try {
                if (!token) {
                    return;
                }
                const response = await getDashboardData(token);

                if (response.data.status === "success") {
                    dispatch(setFriends(response.data.data.friends));
                    dispatch(setFriendReqCount(response.data.data.friendReqCount));
                    dispatch(setUser({ user: response.data.data.user, token }));
                    dispatch(setGroups(response.data.data.groups || []));
                    dispatch(setUnreadPrivateMap(response.data.data.unreadPrivateMsgs || {}));
                    dispatch(setUnreadGroupMap(response.data.data.unreadGroupMsgs || {}));
                    dispatch(setHasFetchedDashboardData(true));
                }
            } catch (error) {
                const errorMessage =
                    error.response?.data?.message ||
                    "Something went wrong while fetching data for dashboard";

                if (errorMessage === "Invalid or expired token") {
                    toast.error("Invalid session. Please log in again.", {
                        autoClose: 3000,
                    });
                    localStorage.removeItem("jwt");
                    navigate("/");
                } else {
                    toast.error(errorMessage, { autoClose: 3000 });
                }
            } finally {
                setLoading(false);
            }
        };
        if (!hasFetched) {
            setLoading(true);
            fetchData();
        } else {
            setLoading(false); // ensure loading is false if we skip fetch
        }
    }, [token, navigate, dispatch, hasFetched, socketRef]);

    const handleLogout = () => {
        if (socketRef && socketRef.connected) {
            socketRef.disconnect();
        }
        localStorage.removeItem("jwt");
        // toast.success("Logged out", { autoClose: 1000 });
        dispatch(clearUser());
        dispatch(clearChatState());
        navigate("/");
    };

    const handleUserClick = (user) => {
        dispatch(clearUnreadPrivateMapEntry(user.id));
        dispatch(setCurrentChat({ data: user, type: "private" }));
        navigate(`/chat/${user.id}?name=${encodeURIComponent(user.name)}`);
    };

    const handleGroupClick = (group) => {
        dispatch(clearUnreadGroupMapEntry(group.id));
        dispatch(setCurrentChat({ data: group, type: "group" }));
        navigate(
            `/groupchat/${group.id}?name=${encodeURIComponent(group.name)}`
        );
    };

    const goToFindPeople = () => {
        navigate("/find-people");
    };

    const goToFriendRequests = () => {
        navigate("/friend-requests");
    };

    const handleUnfriend = async (friendId) => {
        setRemovingFriend(true);
        try {
            const res = await unFriend(friendId, token);

            if (res.data.status === "success") {
                // toast.success("Friend removed!");
                setConfirmUnfriendId(null);
                dispatch(setFriends(friends.filter((f) => f.id !== friendId)));
            } else {
                toast.error(res.data.message || "Failed to unfriend");
            }
        } catch (err) {
            toast.error("Error unfriending user");
        } finally {
            setRemovingFriend(false);
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

        setCreatingGroup(true);

        try {
            const res = await createGroup(
                { name: groupName.trim(), memberIds: selectedFriendIds },
                token
            );

            if (res.data.status === "success") {
                // toast.success("Group created!");
                console.log(res.data);
                setCreatingGroup(false);
                setShowCreateModal(false);
                setGroupName("");
                setSelectedFriendIds([]);
                dispatch(addGroup(res.data.data.group));

            } else {
                toast.error(res.data.message || "Could not create group");
            }
        } catch (err) {
            toast.error("Error creating group");
        } finally {
            setCreatingGroup(false);
        }
    };

    // Handle leave group
    const handleLeaveGroup = async (groupId) => {
        setLeavingGroup(true);
        try {
            const res = await leaveGroup(groupId, token);
            if (res.data.status === "success") {
                toast.success("You left the group");
                setConfirmingDeleteId(false);
                dispatch(setGroups(groups.filter((g) => g.id !== groupId)));
            } else {
                toast.error(res.data.message || "Failed to leave group");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Error leaving group";
            toast.error(msg);
        } finally {
            setLeavingGroup(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            // Close group menu if click is outside
            if (activeMenuGroupId && groupRefs.current[activeMenuGroupId] && !groupRefs.current[activeMenuGroupId].contains(event.target)) {
                setActiveMenuGroupId(null);
            }

            // Close friend menu if click is outside
            if (activeFriendMenuId && friendRefs.current[activeFriendMenuId] && !friendRefs.current[activeFriendMenuId].contains(event.target)) {
                setActiveFriendMenuId(null);
            }

            // Close dropdown for profile and logout
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
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
                    <div className="max-w-full">
                        <div className="max-w-[90vw] sm:max-w-[60vw] md:max-w-[40vw] lg:max-w-[28vw] break-words">
                            <h1
                                className="text-3xl font-bold text-indigo-700"
                                title={user?.name.trim().split(" ")[0]}
                            >
                                {user ? `Welcome ${user?.name.trim().split(" ")[0]}!` : "Welcome!"}
                            </h1>
                        </div>
                        <p className="text-gray-500 text-sm sm:text-base">
                            Stay connected and chat with your friends
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={goToFindPeople}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-lg"
                        >
                            🔍 Find People
                        </button>
                        <motion.div className="relative inline-block">
                            <button
                                onClick={goToFriendRequests}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition duration-300 text-sm sm:text-lg"
                            >
                                📨 Friend Requests
                            </button>

                            {friendReqCount > 0 && (
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-slate-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {friendReqCount}
                                </span>
                            )}
                        </motion.div>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="flex items-end gap-0 focus:outline-none pt-1"
                            >
                                {user?.profileImageUrl ? (
                                    <img
                                        src={user.profileImageUrl}
                                        alt="Avatar"
                                        className="w-9 h-9 rounded-full object-cover border"
                                    />
                                ) : (
                                    // <FaUserCircle className="w-8 h-8 text-gray-500 border rounded-full bg-white" />
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <svg
                                    className="w-3.5 h-3.5 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-1.5 w-40 bg-white border rounded-md shadow-lg z-50">
                                    <button
                                        onClick={() => {
                                            navigate("/profile");
                                            setDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <HiOutlineUserCircle className="w-5 h-5 text-gray-500" />
                                        Profile
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                    >
                                        <HiOutlineLogout className="w-5 h-5 text-red-500" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Friends List */}
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Friends:</h2>
                {loading ? (
                    <div className="flex flex-col items-center justify-center text-gray-500 mt-6 h-[20vh]">
                        <svg
                            className="animate-spin h-6 w-6 text-indigo-500 mb-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            />
                        </svg>
                        <p className="text-sm">Just a sec — getting your friends list...</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-500 mb-10 h-[20vh]">
                        <span className="text-2xl mb-1">👋</span>
                        <p className="text-sm">No friends yet. Send some requests!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                        {friends.map((user, index) => (
                            <motion.div
                                key={user.id}
                                className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-300 relative"
                                title={`Chat with ${user?.name?.split(' ')[0]}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                {/* Friend Info */}
                                <div
                                    onClick={() => handleUserClick(user)}
                                    className="flex items-center space-x-4 cursor-pointer"
                                >
                                    <div className="relative flex-shrink-0">

                                        {/* For clicking the avatar icon */}
                                        <div onClick={(e) => {
                                            e.stopPropagation(); // prevent triggering handleUserClick
                                            setSelectedFriendForModal(user);
                                        }}>
                                            {user?.profileImageUrl ? (
                                                <img
                                                    src={user.profileImageUrl}
                                                    alt="Avatar"
                                                    className="w-12 h-12 rounded-full object-cover border"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {onlineFriends.includes(user.id) && (
                                            <HiOutlineStatusOnline
                                                className="absolute bottom-0 right-0 w-5 h-5 text-green-500 bg-white rounded-full p-0.5 shadow"
                                                title="Online"
                                            />
                                        )}
                                    </div>
                                    <div className="max-w-[60vw] sm:max-w-[40vw] md:max-w-[30vw] lg:max-w-[20vw] truncate">
                                        <p className="font-medium text-gray-800 truncate" title={user.name}> {user.name} </p>
                                        <p className="text-sm text-gray-500 truncate" title={user.email}> {user.email} </p>
                                    </div>
                                </div>

                                {/* ⋮ Friend Options Button */}
                                <div
                                    className="absolute top-2 right-2"
                                    ref={(el) => {
                                        if (el) friendRefs.current[user.id] = el;
                                    }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFriendMenuId((prev) =>
                                                prev === user.id ? null : user.id
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
                                                    setConfirmUnfriendId(user.id);
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
                                {unreadPrivateMap[user.id] && (
                                    <span className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-bounce"></span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Group List - Only show if friends exist */}
                {!loading && groups.length > 0 && (
                    <>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Groups:</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
                            {groups.map((group, index) => {
                                const isSuperAdmin = group.superAdmin === user?.id;
                                return (
                                    < motion.div
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
                                            {/* <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600 font-bold text-lg">
                                                {group.name?.charAt(0).toUpperCase()}
                                            </div> */}
                                            <div onClick={(e) => {
                                                e.stopPropagation(); // prevent triggering handleUserClick
                                                setSelectedGroupForModal(group);
                                            }}>
                                                {group?.groupImageUrl ? (
                                                    <img
                                                        src={group.groupImageUrl}
                                                        alt="Avatar"
                                                        className="w-12 h-12 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                                                        {group.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="max-w-[10rem]">
                                                <p className="font-medium text-gray-800 break-words leading-snug">
                                                    {group.name}
                                                </p>
                                                <p className="text-sm text-gray-500">Group Chat</p>
                                            </div>
                                        </div>

                                        {/* ⋮ Menu Toggle */}
                                        <div
                                            className="absolute top-2 right-2"
                                            ref={(el) => {
                                                if (el) groupRefs.current[group.id] = el;
                                            }}
                                        >
                                            <button
                                                className="text-gray-500 hover:text-gray-800 text-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuGroupId((prev) =>
                                                        prev === group.id ? null : group.id
                                                    );
                                                }}
                                            >
                                                ⋮
                                            </button>

                                            {activeMenuGroupId === group.id && (
                                                <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-md z-50">
                                                    <button
                                                        onClick={() => {
                                                            setConfirmingDeleteId(group.id);
                                                            setActiveMenuGroupId(null);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-sm text-red-600 ${isSuperAdmin ? 'cursor-not-allowed' : 'hover:bg-red-50'}`}
                                                        disabled={isSuperAdmin}
                                                        title={isSuperAdmin ? "Admin cannot leave group" : "Leave group"}
                                                    >
                                                        Leave
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* 🔴 Unread Indicator */}
                                        {unreadGroupMap[group.id] && (
                                            <span className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-bounce"></span>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
            {/* Floating + Button aligned to container but fixed on screen (Only show if atleast one friend exists)*/}
            {friends.length > 0 &&
                <div className="fixed bottom-6 left-1/2 w-full max-w-4xl px-4 transform -translate-x-1/2 flex justify-end z-50">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-2xl w-14 h-14 rounded-full shadow-lg transition duration-300"
                        title="Create Group"
                    >
                        +
                    </button>
                </div>
            }
            <AnimatePresence>
                {showLogoutModal && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white p-6 rounded-xl shadow-lg w-80"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Logout</h3>
                            <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out?</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLogoutModal(false);
                                        handleLogout();
                                    }}
                                    className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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

                            {creatingGroup ? (
                                <div className="flex flex-col items-center px-4 py-2">
                                    <div className="flex space-x-1">
                                        <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {confirmingDeleteId && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-5 shadow-lg max-w-sm w-full text-center">
                        <p className="text-gray-800 font-medium mb-4">
                            {leavingGroup ? "One moment... leaving the group" : "Are you sure you want to leave this group?"}
                        </p>
                        <div className="flex justify-center gap-4">
                            {leavingGroup ? (
                                <div className="flex flex-col items-center px-4 py-2">
                                    <div className="flex space-x-1">
                                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            ) : (
                                <>
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
                                            handleLeaveGroup(confirmingDeleteId);
                                        }}
                                        className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                                    >
                                        Yes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {confirmUnfriendId && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-5 shadow-lg max-w-sm w-full text-center">
                        <p className="text-gray-800 font-medium mb-4">
                            {removingFriend ? "One moment... Removing friend" : "Are you sure you want to unfriend this person?"}
                        </p>
                        <div className="flex justify-center gap-4">
                            {removingFriend ? (
                                <div className="flex flex-col items-center px-4 py-2">
                                    <div className="flex space-x-1">
                                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setConfirmUnfriendId(null)}
                                        className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleUnfriend(confirmUnfriendId);
                                        }}
                                        className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md"
                                    >
                                        Unfriend
                                    </button>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            )}
            <AnimatePresence>
                {selectedFriendForModal && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedFriendForModal(null)}
                    >
                        <motion.div
                            className="bg-white rounded-xl shadow-xl w-80 relative overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                className="absolute top-2 right-3 text-white text-xl z-10"
                                onClick={() => setSelectedFriendForModal(null)}
                            >
                                ×
                            </button>

                            {/* Image Section */}
                            <div className="relative h-72 bg-gray-200 flex justify-center">
                                {selectedFriendForModal?.profileImageUrl ? (
                                    <img
                                        src={selectedFriendForModal.profileImageUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-5xl font-bold">
                                        {selectedFriendForModal?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute top-0 w-full px-6 truncate bg-black bg-opacity-40 text-white text-center py-2 text-lg font-semibold">
                                    {selectedFriendForModal?.name}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-around py-4 px-2">
                                {/* Chat */}
                                <button
                                    onClick={() => {
                                        handleUserClick(selectedFriendForModal);
                                        setSelectedFriendForModal(null);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 text-2xl"
                                    title="Chat"
                                >
                                    <HiOutlineChatBubbleLeftRight />
                                </button>

                                {/* View Profile */}
                                <button
                                    onClick={() => {
                                        navigate(`/profile/${selectedFriendForModal?.id}`)
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                    title="View Profile"
                                >
                                    <HiOutlineUserCircle />
                                </button>

                                {/* Unfriend */}
                                <button
                                    onClick={() => {
                                        setConfirmUnfriendId(selectedFriendForModal.id);
                                        setSelectedFriendForModal(null);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-2xl"
                                    title="Unfriend"
                                >
                                    <HiOutlineUserMinus />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedGroupForModal && (() => {
                    const isSuperAdmin = selectedGroupForModal.superAdmin === user?.id;
                    return (
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedGroupForModal(null)}
                        >
                            <motion.div
                                className="bg-white rounded-xl shadow-xl w-80 relative overflow-hidden"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button
                                    className="absolute top-2 right-3 text-white text-xl z-10"
                                    onClick={() => setSelectedGroupForModal(null)}
                                >
                                    ×
                                </button>

                                {/* Image Section */}
                                <div className="relative h-72 bg-gray-200 flex justify-center">
                                    {selectedGroupForModal?.groupImageUrl ? (
                                        <img
                                            src={selectedGroupForModal.groupImageUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-5xl font-bold">
                                            {selectedGroupForModal?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute top-0 w-full px-6 truncate bg-black bg-opacity-40 text-white text-center py-2 text-lg font-semibold">
                                        {selectedGroupForModal?.name}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-around py-4 px-2">
                                    {/* Chat */}
                                    <button
                                        onClick={() => {
                                            handleGroupClick(selectedGroupForModal);
                                            setSelectedGroupForModal(null);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 text-2xl"
                                        title="Chat"
                                    >
                                        <HiOutlineChatBubbleLeftRight />
                                    </button>

                                    {/* View Group */}
                                    <button
                                        onClick={() => {
                                            navigate(`/group/${selectedGroupForModal.id}`)
                                        }}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                        title="View group info"
                                    >
                                        <HiOutlineInformationCircle />
                                    </button>

                                    {/* Leave */}
                                    <button
                                        onClick={() => {
                                            setConfirmingDeleteId(selectedGroupForModal.id);
                                            setSelectedGroupForModal(null);
                                        }}
                                        className={`text-red-500  text-2xl ${isSuperAdmin ? 'cursor-not-allowed' : 'hover:text-red-700'}`}
                                        title="Leave group"
                                        disabled={isSuperAdmin}
                                    >
                                        <FiLogOut />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

        </div >
    );
}