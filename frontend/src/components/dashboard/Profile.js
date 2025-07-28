import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { viewProfile, editProfile, forgetPassword } from "../../api";
import { setUser } from "../../store/userSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.user.user);
    const token = localStorage.getItem("jwt");

    const [form, setForm] = useState({
        name: "",
        phoneNo: "",
        address: "",
        dob: "",
        gender: "",
        file: null,
    });
    const [editMode, setEditMode] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // useEffect(() => {
    //     console.log(user);
    // }, [user]);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                phoneNo: user.phoneNo || "",
                address: user.address || "",
                dob: user.dob || "",
                gender: user.gender || "",
                file: user.profileImageUrl || null,
            });
        }
    }, [user]);

    useEffect(() => {
        const getProfileData = async () => {
            setProfileLoading(true);
            try {
                const res = await viewProfile(token);
                if (res.data.status === "success") {
                    dispatch(setUser({ user: res.data.data, token }));
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Something went wrong while fetching profile data";
                toast.error(errorMessage, { autoClose: 3000 });
            } finally {
                setProfileLoading(false);
            }
        };

        getProfileData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleEditClick = () => {
        setEditMode(true);
    };

    const handleCancel = () => {
        setEditMode(false);
        setForm({
            name: user.name || "",
            phoneNo: user.phoneNo || "",
            address: user.address || "",
            dob: user.dob || "",
            gender: user.gender || "",
            file: user.profileImageUrl || null,
        });
    };

    const editHandler = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("phoneNo", form.phoneNo);
            formData.append("address", form.address);
            formData.append("dob", form.dob);
            formData.append("gender", form.gender);

            // Only append file if it's a real File object
            if (form.file && typeof form.file === "object") {
                formData.append("file", form.file);
            }


            const res = await editProfile(formData, token);
            if (res.data.status === "success") {
                const newToken = res.data.data.token;
                dispatch(setUser({ user: res.data.data.user, token: newToken }));
                // toast.success("Profile updated successfully", { autoClose: 3000 });
                localStorage.setItem('jwt', newToken);
                setEditMode(false);
            } else {
                toast.error(res.data.message || "Update failed", { autoClose: 3000 });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong", { autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const changePasswordHandler = async () => {
        setChangingPassword(true);
        try {
            const res = await forgetPassword({ email: user.email });
            if (res.data.status === 'success') {
                // localStorage.removeItem("jwt");
                navigate("/verify-token", { state: { email: user.email, mode: "profileChangePassword" } });
                setChangingPassword(false);
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Something went wrong";
            toast.error(msg, { autoClose: 3000 });
        } finally {
            setChangingPassword(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white shadow-md rounded-lg p-6 w-full max-w-3xl min-h-[720px] sm:min-h-[700px]"
            >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-indigo-700">Profile</h1>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-300"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex items-center space-x-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-300 group">
                            {(form.file && typeof form.file === "object") || user?.profileImageUrl ? (
                                <img
                                    src={
                                        form.file && typeof form.file === "object"
                                            ? URL.createObjectURL(form.file)
                                            : user?.profileImageUrl
                                    }
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                // <FaUserCircle className="w-full h-full text-gray-400 bg-gray-100 rounded-full p-4" />
                                <div className="w-full h-full flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-3xl">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {editMode && (
                                <div
                                    onClick={() => document.getElementById("profileImageInput").click()}
                                    className="absolute bottom-2.5 right-2.5 bg-white p-1 rounded-full shadow-md cursor-pointer hover:bg-gray-100"
                                    title="Change profile picture"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3.5 w-3.5 text-gray-700"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M17.414 2.586a2 2 0 00-2.828 0L6 11.172V14h2.828l8.586-8.586a2 2 0 000-2.828z" />
                                        <path fillRule="evenodd" d="M4 16h12v2H4a2 2 0 01-2-2V4h2v12z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-lg font-medium text-gray-800">{user?.name}</p>
                            {/* <p className="text-sm text-gray-500">{user?.email}</p> */}
                            {!profileLoading && (
                                <>
                                    {/* <p className="text-sm text-gray-500">+91 {user?.phoneNo}</p> */}
                                    <button
                                        onClick={changePasswordHandler}
                                        className="bg-blue-500 text-white text-xs px-2 py-1 rounded-md hover:bg-blue-600 transition"
                                    >
                                        {changingPassword ? "Just a sec..." : "Change Password"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>


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
                            <p className="text-sm">Getting your profile ready...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="profile-content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        disabled={!editMode || loading}
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={user?.email}
                                        disabled
                                        className="w-full px-4 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                                    <div className="flex">
                                        <span className="flex items-center px-2 rounded-md rounded-r-none border border-r-0 text-gray-600 bg-gray-100 text-sm">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            name="phoneNo"
                                            value={form.phoneNo}
                                            onChange={handleChange}
                                            disabled={!editMode || loading}
                                            className="w-full px-4 py-2 border rounded-md rounded-l-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={form.dob}
                                        onChange={handleChange}
                                        disabled={!editMode || loading}
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        disabled={!editMode || loading}
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="" disabled>Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                                    <textarea
                                        type="text"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        disabled={!editMode || loading}
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 text-right space-x-3">
                                {editMode ? (
                                    <>
                                        {!loading && (
                                            <button
                                                onClick={handleCancel}
                                                type="button"
                                                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            onClick={editHandler}
                                            type="button"
                                            disabled={loading || loading}
                                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
                                        >
                                            {loading ? "Saving..." : "Save"}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleEditClick}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <input
                type="file"
                id="profileImageInput"
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
        </div>

    );
}
