import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import TextareaAutosize from 'react-textarea-autosize';
import { getGroupInfo, editGroupInfo, inviteToGroup, setAdminAPI, removeAdmin, removeFromGroup } from "../../api"; // You’ll need to implement these
import { addGroupMembers, removeNonMemberFriends, setCurrentChat, setGroupMembers, setNonMemberFriends } from "../../store/chatSlice";
import { jwtDecode } from "jwt-decode";
import { HiShieldCheck, HiUserAdd, HiUserRemove } from "react-icons/hi";
import { FaMinusCircle, FaPlusCircle, FaUserTie } from "react-icons/fa";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { clearUnreadGroupMapEntry } from "../../store/userSlice";
import { FiEdit3, FiSave, FiX } from "react-icons/fi";

export default function GroupInfo() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = localStorage.getItem('jwt');

    // const user = useSelector((state) => state.user.user);
    const members = useSelector((state) => state.chat.groupMembers);
    const nonMemberFriends = useSelector((state) => state.chat.nonMemberFriends);

    const [group, setGroup] = useState(null);
    const [form, setForm] = useState({
        name: "",
        file: null,
    });
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [isAdmin, setIsAdmin] = useState(null);
    const [superAdmin, setSuperAdmin] = useState();
    const [isSuperAdmin, setIsSuperAdmin] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [addingMember, setAddingMember] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // for admin toggle modal
    const [confirmRemoveMember, setConfirmRemoveMember] = useState(null); // for remove user modal
    const [adminprocessing, setAdminProcessing] = useState(false);
    const [removingFromGroup, setRemovingFromGroup] = useState([]);
    const [removedMembers, setRemovedMembers] = useState([]);

    const textareaRef = useRef(null);
    const inviteModalRef = useRef(null);
    const confirmRemoveModalRef = useRef(null);

    const canEdit = group && (isAdmin || isSuperAdmin);

    // let loggedInUserId = null;

    useEffect(() => {
        if (!token) return;

        try {
            const decodedUser = jwtDecode(token);
            setLoggedInUserId(decodedUser.id);
        } catch (error) {
            toast.error("Error setting current user");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // To set group admins
    useEffect(() => {
        setIsAdmin(admin === loggedInUserId);
        setIsSuperAdmin(superAdmin === loggedInUserId);
        console.log("SuperAdmin: ", superAdmin, "| Admin: ", admin, "User: ", loggedInUserId);
    }, [admin, superAdmin, loggedInUserId]);

    useEffect(() => {
        const fetchGroupData = async () => {
            setProfileLoading(true);
            try {
                const res = await getGroupInfo(id, token);
                if (res.data.status === "success") {
                    setGroup(res.data.data.group);
                    setSuperAdmin(res.data.data.group.superAdmin);
                    setAdmin(res.data.data.group.admin);
                    dispatch(setGroupMembers(res.data.data.members));
                    dispatch(setNonMemberFriends(res.data.data.nonMemberFriends));
                    setForm({
                        name: res.data.data.group.name || "",
                        file: res.data.data.group.groupImageUrl || null,
                    });
                }
            } catch (err) {
                const msg = err.response?.data?.message || "Failed to load group";
                toast.error(msg, { autoClose: 3000 });
            } finally {
                setProfileLoading(false);
            }
        };
        fetchGroupData();
    }, [dispatch, id, token]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [form.name]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleEditClick = () => {
        setEditMode(true);
    };

    const handleCancel = () => {
        setEditMode(false);
        if (group) {
            setForm({
                name: group.name,
                file: group.groupImageUrl,
            });
        }
    };

    const editHandler = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            if (form.file && typeof form.file === "object") {
                formData.append("file", form.file);
            }

            const res = await editGroupInfo(id, formData, token);
            if (res.data.status === "success") {
                // toast.success("Group updated", { autoClose: 3000 });
                setGroup(res.data.data);
                setEditMode(false);
            } else {
                toast.error(res.data.message || "Failed to update", { autoClose: 3000 });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong", { autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMultiple = async (friendIds) => {
        setAddingMember(true);
        try {
            const res = await inviteToGroup(
                { groupId: parseInt(id), friendIds },
                token
            );
            if (res.data.status === "success") {
                dispatch(addGroupMembers(res.data.data));
                dispatch(removeNonMemberFriends(res.data.data));
                // toast.success("Friends added to group");
                // fetchGroupMessages(); // refresh members
            } else {
                toast.error(res.data.message || "Could not add friends");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Error adding friends";
            toast.error(msg);
        } finally {
            setAddingMember(false);
        }
    };

    const setAdminHandler = async (memberId) => {
        setAdminProcessing(true);
        try {
            const res = await setAdminAPI(id, memberId, token);
            if (res.data.status === 'success') {
                setAdmin(memberId);
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Error setting admin";
            toast.error(msg);
        } finally {
            setPendingAction(null);
            setAdminProcessing(false);
        }
    }

    const removeAdminHandler = async (memberId) => {
        setAdminProcessing(true);
        try {
            const res = await removeAdmin(id, token);
            if (res.data.status === 'success') {
                setAdmin(null);
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Error removing admin";
            toast.error(msg);
        } finally {
            setPendingAction(null);
            setAdminProcessing(false);
        }
    }

    const handleRemoveFromGroup = async (memberId) => {
        setRemovingFromGroup((prev) => [...prev, memberId]);
        try {
            const res = await removeFromGroup(id, memberId, token);
            if (res.data.status === "success") {
                // dispatch(setGroupMembers(members.filter((m) => m.id !== memberId)));
                setRemovedMembers((prev) => [...prev, memberId]);
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Error removing from group";
            toast.error(msg);
        } finally {
            setRemovingFromGroup((prev) => prev.filter((mem) => mem !== memberId));
        }
    }

    const handleChatClick = (group) => {
        dispatch(clearUnreadGroupMapEntry(group?.id));
        dispatch(setCurrentChat({ data: group, type: "group" }));
        navigate(
            `/groupchat/${group?.id}?name=${encodeURIComponent(group?.name)}`
        );
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white shadow-md rounded-lg p-6 w-full max-w-3xl min-h-[720px]"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-indigo-700">Group Info</h1>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-300"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {profileLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center text-gray-500 mt-6 h-[20vh]"
                        >
                            <svg className="animate-spin h-6 w-6 text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <p className="text-sm">Fetching group data...</p>
                        </motion.div>
                    ) : (
                        group && (
                            <motion.div
                                key="group-content"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    {/* Avatar + Name Section */}
                                    <div className="flex items-center gap-4">
                                        {/* Group Avatar */}
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-300 group">
                                            {(form.file && typeof form.file === "object") || group?.groupImageUrl ? (
                                                <img
                                                    src={
                                                        form.file && typeof form.file === "object"
                                                            ? URL.createObjectURL(form.file)
                                                            : group?.groupImageUrl
                                                    }
                                                    alt="Profile"
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    onClick={() =>
                                                        group?.groupImageUrl && window.open(group?.groupImageUrl, "_blank")
                                                    }
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-3xl">
                                                    {group?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            {editMode && (
                                                <div
                                                    onClick={() => document.getElementById("groupImageInput").click()}
                                                    className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md cursor-pointer hover:bg-gray-100"
                                                    title="Change profile picture"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 text-gray-700"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M17.414 2.586a2 2 0 00-2.828 0L6 11.172V14h2.828l8.586-8.586a2 2 0 000-2.828z" />
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4 16h12v2H4a2 2 0 01-2-2V4h2v12z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Name and Actions */}
                                        <div className="flex flex-row">
                                            {/* Group Name */}
                                            <TextareaAutosize
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                disabled={!editMode || loading}
                                                ref={textareaRef}
                                                className={`text-lg font-medium px-2 py-1 border rounded-md resize-none focus:outline-none focus:ring-2 ${editMode
                                                    ? 'text-gray-800 border-gray-300 focus:ring-indigo-500'
                                                    : 'text-gray-700 border-b border-gray-300 rounded-none cursor-default'
                                                    }`}
                                            />

                                            {/* Edit / Save / Cancel Actions */}
                                            {canEdit && (
                                                <div className="mt-2 flex gap-1 items-center">
                                                    {editMode ? (
                                                        <>
                                                            {!loading && (
                                                                <button
                                                                    onClick={handleCancel}
                                                                    type="button"
                                                                    className="text-gray-500 hover:text-red-500 p-1"
                                                                    title="Cancel"
                                                                >
                                                                    <FiX className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={editHandler}
                                                                type="button"
                                                                disabled={loading}
                                                                className={`p-1 ${loading
                                                                    ? 'text-gray-400'
                                                                    : 'text-green-600 hover:text-green-800'
                                                                    }`}
                                                                title="Save"
                                                            >
                                                                <FiSave className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={handleEditClick}
                                                            className="text-gray-500 hover:text-indigo-600 p-1"
                                                            title="Edit"
                                                        >
                                                            <FiEdit3 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Chat Button - Separate Action Block */}
                                    <div>
                                        <button
                                            onClick={() => handleChatClick(group)}
                                            className="text-indigo-600 hover:text-indigo-800 p-2"
                                            title="Chat"
                                        >
                                            <HiOutlineChatBubbleLeftRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="mb-6">
                                        <div className="flex flex-row justify-between">
                                            <h2 className="text-md font-semibold text-gray-600 mb-2">Group Members</h2>
                                            {(isSuperAdmin || isAdmin) && (
                                                <button
                                                    onClick={() => {
                                                        setShowInviteModal(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm px-2"
                                                    title="Invite Friends"
                                                >
                                                    <HiUserAdd className="w-6 h-6" />
                                                </button>
                                            )}
                                        </div>
                                        <ul className="divide-y divide-gray-100 rounded-md border">
                                            {members.map((member) => {
                                                const isCurrentUser = member.id === loggedInUserId;
                                                const isSuperAdminUser = member.id === superAdmin;
                                                const isAdminUser = member.id === admin;
                                                const isRemoved = removedMembers.includes(member.id);

                                                return (
                                                    <li key={member.id}>
                                                        <div
                                                            className={`flex items-center justify-between gap-3 px-4 py-3 ${isCurrentUser || isRemoved ? 'bg-gray-50' : 'hover:bg-indigo-50 cursor-pointer'} transition rounded-md group`}
                                                            onClick={() => {
                                                                if (!isCurrentUser && !isRemoved) {
                                                                    navigate(`/profile/${member.id}`);
                                                                }
                                                            }}
                                                        >
                                                            {/* LEFT SECTION */}
                                                            <div className="flex items-center gap-3 flex-1">
                                                                {/* Avatar */}
                                                                <div className="relative w-10 h-10">
                                                                    {member.profileImageUrl ? (
                                                                        <img
                                                                            src={member.profileImageUrl}
                                                                            alt="Avatar"
                                                                            className="w-10 h-10 rounded-full object-cover border"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                                                                            {member.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}

                                                                    {/* Admin / Superadmin Badge */}
                                                                    {(isSuperAdminUser || isAdminUser) ? (
                                                                        <div
                                                                            className="absolute -top-2 -right-2 bg-white border rounded-full p-[2px] shadow-sm"
                                                                            title={isSuperAdminUser ? "Super Admin" : "Admin"}
                                                                        >
                                                                            {isSuperAdminUser ? (
                                                                                <HiShieldCheck className="text-blue-600 w-3.5 h-3.5" />
                                                                            ) : (
                                                                                <FaUserTie className="text-gray-600 w-3.5 h-3.5" />
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        isSuperAdmin && !admin && (
                                                                            <button
                                                                                className="absolute -top-1 -right-1 bg-white border rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition"
                                                                                title="Make Admin"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPendingAction({ type: 'set', member }); // opens modal
                                                                                }}
                                                                            >
                                                                                <FaPlusCircle className="text-gray-600 w-3.5 h-3.5" />
                                                                            </button>
                                                                        )
                                                                    )}

                                                                    {/* If this member IS admin, show remove icon on hover (only superadmin sees this) */}
                                                                    {isSuperAdmin && isAdminUser && (
                                                                        <button
                                                                            className="absolute -top-2 -right-2 bg-white border rounded-full p-[2px] shadow-sm opacity-0 group-hover:opacity-100 transition"
                                                                            title="Remove Admin"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPendingAction({ type: 'remove', member }); // opens modal
                                                                            }}
                                                                        >
                                                                            <FaMinusCircle className="text-red-500 w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Name + Email */}
                                                                <div className="flex flex-col w-auto truncate">
                                                                    <p className={`text-sm font-medium ${isRemoved ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                                                                        {isCurrentUser ? 'You' : member.name}
                                                                    </p>
                                                                    <p className={`text-xs text-gray-500 truncate ${isRemoved ? 'text-gray-300 italic' : 'text-gray-500'}`}>
                                                                        {isCurrentUser ? '' : member.email}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* RIGHT SIDE ACTIONS */}
                                                            <div className="flex items-center gap-2">

                                                                {/* Remove from group */}
                                                                {/* {(isAdmin || isSuperAdmin) && !isCurrentUser && !isSuperAdminUser && (
                                                                    <button
                                                                        title="Remove from group"
                                                                        onClick={() => setConfirmRemoveMember(member)}
                                                                        className="text-gray-500 hover:text-red-600 transition"
                                                                    >
                                                                        <HiUserRemove className="w-5 h-5" />
                                                                    </button>
                                                                )} */}
                                                                {isRemoved ? (
                                                                    <span
                                                                        className="text-xs font-semibold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full"
                                                                        title="This user has been removed from the group"
                                                                    >
                                                                        Removed
                                                                    </span>
                                                                ) : (
                                                                    isSuperAdmin || isAdmin) && !isCurrentUser && !isSuperAdminUser && (
                                                                    <>
                                                                        {!removingFromGroup.includes(member.id) ? (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setConfirmRemoveMember(member);
                                                                                }}
                                                                                title="Remove from group"
                                                                                className="text-gray-500 hover:text-red-600 transition rounded-full"
                                                                            >
                                                                                <HiUserRemove className="w-5 h-5" />
                                                                            </button>
                                                                        ) : (
                                                                            <div
                                                                                className="w-5 h-5 border-2 border-t-2 border-red-500 border-t-transparent rounded-full animate-spin"
                                                                                title="Removing from group..."
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                </div>


                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </motion.div>

            <input
                type="file"
                id="groupImageInput"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        setForm((prev) => ({
                            ...prev,
                            file: e.target.files[0],
                        }));
                    }
                }}
            />

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

                        {nonMemberFriends.length > 0 ? (
                            <ul className="divide-y">
                                {nonMemberFriends.map((friend) => (
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
                                                    (prev) => checked ? [...prev, friend.id,] : prev.filter((id) => id !== friend.id)
                                                );
                                            }}
                                        />
                                        <div>
                                            <div className="text-sm text-gray-800 font-medium max-w-[14rem] truncate">
                                                {friend.name}
                                            </div>
                                            <div className="text-xs text-gray-500 max-w-[14rem] truncate">
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
                            {addingMember ? (
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
                                        onClick={
                                            () => {
                                                setSelectedFriends([]);
                                                setShowInviteModal(false);
                                            }
                                        }
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {pendingAction && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center break-words">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">
                            {pendingAction.type === 'set' ? "Make Admin?" : "Remove Admin?"}
                        </h2>
                        <p className="text-sm text-gray-600 mb-5">
                            {pendingAction.type === 'set'
                                ? `Do you want to make ${pendingAction.member.name} the group admin?`
                                : `Are you sure you want to remove ${pendingAction.member.name}'s admin privileges?`}
                        </p>
                        <div className="flex justify-end gap-3">
                            {adminprocessing ? (
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
                                        onClick={() => setPendingAction(null)}
                                        className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (pendingAction.type === 'set') {
                                                setAdminHandler(pendingAction.member.id);
                                            } else {
                                                removeAdminHandler(pendingAction.member.id);
                                            }

                                        }}
                                        className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                                    >
                                        Confirm
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Removing Member Modal */}
            {confirmRemoveMember && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-80" ref={confirmRemoveModalRef}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to remove{" "}
                            <strong className="text-gray-800 font-medium break-words">
                                {confirmRemoveMember?.name}
                            </strong>{" "}
                            from the group?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmRemoveMember(null)}
                                className="px-3 py-1 text-sm bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleRemoveFromGroup(confirmRemoveMember?.id);
                                    setConfirmRemoveMember(null);
                                }}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}