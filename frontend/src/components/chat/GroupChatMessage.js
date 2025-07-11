import React, { memo } from "react";
import { motion } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { HiEmojiHappy, HiDotsHorizontal, HiPlusSm, HiOutlineChat, HiDownload, HiPhotograph, HiVideoCamera } from "react-icons/hi";
import { BsCheck, BsCheckAll } from "react-icons/bs";

function GroupChatMessage({
    msg,
    i,
    isSender,
    prevDate,
    currentDate,
    isReadAll,
    msgCount,
    loggedInUserId,
    reactionPickerId,
    setReactionPickerId,
    showFullEmojiPickerId,
    setShowFullEmojiPickerId,
    setSeenModalData,
    handleReact,
    handleEditClick,
    onReply,
    setSelectedMessage,
    getUserColor,
    getMinWidth,
    getMaxWidth,
    formatTime,
    reactionPickerRef,
    fullReactionPickerRef,
    availableReactions,
    downloadedFile,
    onDownload,
}) {
    const existingReaction = msg.reactions?.find(r => r.userId === loggedInUserId);

    return (
        <div id={`msg_${msg.id}`}>
            {/* Date Divider */}
            {prevDate !== currentDate && (
                <div className="flex items-center justify-center my-4">
                    <hr className="flex-1 border-gray-300" />
                    <span className="px-3 text-xs text-gray-500">{currentDate}</span>
                    <hr className="flex-1 border-gray-300" />
                </div>
            )}

            {/* System message */}
            {msg.type === "system" ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-center"
                >
                    <div className="text-gray-700 text-xs px-4 py-1">
                        {msg.message}
                    </div>
                </motion.div>
            ) : (
                <div className={`flex ${isSender ? "justify-end" : "justify-start"} relative`}>
                    <motion.div
                        initial={{ opacity: 0, x: isSender ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0, minWidth: getMinWidth(msg), maxWidth: getMaxWidth(msg) }}
                        transition={{ duration: 0.3 }}
                        className={`group mb-2 p-3 rounded-xl text-sm shadow-md w-fit break-words whitespace-pre-wrap relative ${isSender ? "bg-indigo-100 self-end" : "bg-white self-start"} ${msgCount === 0 && "mt-2"}`}
                        style={{ minWidth: getMinWidth(msg), maxWidth: getMaxWidth(msg) }}
                    >
                        {!isSender && (
                            <div className={`text-xs font-semibold ${getUserColor(msg.senderId)} mb-1`}>
                                {msg.sender?.name?.split(" ")[0]}
                            </div>
                        )}
                        <div className="text-left">
                            {msg.isDeleted ? (
                                <span className="italic text-gray-400">This message was deleted</span>
                            ) : (
                                <>
                                    {msg.repliedMessage && (
                                        <div className="border-l-4 border-blue-300 pl-2 mb-2 mt-2 text-xs text-gray-600">
                                            <div className={`text-xs font-semibold ${getUserColor(msg.repliedMessage.sender?.id)} mb-1`}>
                                                {msg.repliedMessage.sender?.name?.split(" ")[0]}
                                            </div>
                                            {msg.repliedMessage.message}
                                        </div>
                                    )}

                                    {/* text message */}
                                    {msg.message && (
                                        <div>{msg.message}</div>
                                    )}

                                    {/* image file */}
                                    {msg.fileType === "image" && (
                                        <div className="relative mt-2">
                                            <img
                                                src={downloadedFile?.url
                                                    ? downloadedFile?.url
                                                    : msg.fileUrl.replace('/upload/', '/upload/e_blur:1000/')
                                                }
                                                alt="preview"
                                                className="rounded-lg max-h-64 w-full object-contain"
                                                onClick={() => downloadedFile && window.open(downloadedFile, "_blank")}
                                            />

                                            {!downloadedFile?.url && (
                                                <>
                                                    <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded">
                                                        <HiPhotograph className="w-5 h-5" />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            onDownload(msg)
                                                        }}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/30 text-white rounded-lg hover:bg-black/40 transition"
                                                    >
                                                        {downloadedFile?.loading ? (
                                                            <div className="animate-spin h-6 w-6 border-2 border-t-transparent border-white rounded-full"></div>
                                                        ) : (
                                                            <HiDownload className="w-8 h-8" />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* video file */}
                                    {msg.fileType === "video" && (
                                        <div className="relative mt-2">
                                            <video
                                                src={downloadedFile?.url ? downloadedFile?.url : msg.fileUrl.replace('/upload/', '/upload/e_blur:1000/')}
                                                controls={downloadedFile?.url ? true : false}
                                                className="rounded-lg max-h-64 w-full cursor-pointer"
                                            />
                                            {!downloadedFile?.url && (
                                                <>
                                                    <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded">
                                                        <HiVideoCamera className="w-5 h-5" />
                                                    </div>
                                                    <button
                                                        onClick={() => { onDownload(msg) }}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/30 text-white rounded-lg hover:bg-black/40 transition"
                                                    >
                                                        {downloadedFile?.loading ? (
                                                            <div className="animate-spin h-6 w-6 border-2 border-t-transparent border-white rounded-full"></div>
                                                        ) : (
                                                            <HiDownload className="w-8 h-8" />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* other files */}
                                    {msg.fileType && msg.fileType !== "image" && msg.fileType !== "video" && (
                                        <div className="relative mt-2 w-fit">
                                            <div
                                                className="flex items-center justify-between gap-3 p-2 border border-gray-300 rounded-md transition-colors w-60"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="font-medium text-sm truncate w-48">{msg.fileName}</div>
                                                    {msg.fileSize && (
                                                        <div className="text-xs text-gray-500">{(msg.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                                                    )}
                                                </div>

                                                <a
                                                    href={msg.fileUrl}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-600 hover:text-gray-800 transition"
                                                    title="Download File"
                                                >
                                                    <HiDownload className="w-6 h-6" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {!msg.isDeleted && (
                            <div className={`flex items-center mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                <div className={`text-[10px] pr-0 text-gray-400 ${isSender ? 'text-right' : 'text-left'} flex items-center gap-1`}>
                                    {formatTime(msg.createdAt)}{" "}
                                    {!!msg.isEdited && <span className="italic">(edited)</span>}

                                    {isSender && (
                                        <span
                                            style={{ color: isReadAll ? "#3B82F6" : "#9CA3AF" }}
                                        >
                                            {isReadAll ? (
                                                <BsCheckAll className="inline-block w-4 h-4" />
                                            ) : (
                                                <BsCheck className="inline-block w-4 h-4" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* WhatsApp-style reactions at bottom */}
                        {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                            <div className={`absolute -bottom-3 ${isSender ? '-left-2' : '-right-2'} flex gap-1 flex-nowrap`}>
                                {Object.entries(
                                    msg.reactions.reduce((acc, reaction) => {
                                        if (!acc[reaction.reaction]) acc[reaction.reaction] = [];
                                        acc[reaction.reaction].push(reaction);
                                        return acc;
                                    }, {})
                                ).map(([emoji, reactions]) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReact(msg.id, emoji, existingReaction)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all duration-200 shadow-md border-2 backdrop-blur-sm ${reactions.some(r => r.userId === loggedInUserId)
                                            ? 'bg-indigo-100/90 text-indigo-800 border-indigo-200 hover:bg-indigo-200/90'
                                            : 'bg-white/90 text-gray-600 border-gray-200 hover:bg-gray-50/90 hover:shadow-lg'
                                            } transform hover:scale-105`}
                                        title={reactions.map(r => r?.userName?.split(' ')[0] || 'Someone').join(', ')}
                                    >
                                        <span className="text-[12px]">{emoji}</span>
                                        {reactions.length > 1 && (
                                            <span className="font-semibold min-w-[12px] text-center text-[10px]">{reactions.length}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Quick reaction picker */}
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
                                            handleReact(msg.id, emoji, existingReaction);
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

                        {/* Full emoji picker */}
                        {showFullEmojiPickerId === msg.id && (
                            <div className={`absolute ${isSender ? 'right-0' : 'left-0'} ${msgCount < 3 ? 'top-full mt-3' : 'bottom-full mb-2'} z-30`}>
                                <div
                                    ref={fullReactionPickerRef}
                                    style={{
                                        transform: "scale(0.6)",
                                        transformOrigin: isSender
                                            ? (msgCount < 3 ? 'top right' : 'bottom right')
                                            : (msgCount < 3 ? 'top left' : 'bottom left')
                                    }}
                                >
                                    <EmojiPicker
                                        onEmojiClick={(emojiData) => handleReact(msg.id, emojiData.emoji, existingReaction)}
                                        theme="light"
                                    />
                                </div>
                            </div>
                        )}


                        {/* Floating top icons */}
                        <div className={`absolute -top-2 ${isSender ? '-right-2' : '-left-2'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                            {!msg.isDeleted && (
                                <>
                                    <button
                                        onClick={() => onReply({ id: msg.id, message: msg.message })}
                                        className="text-gray-700 hover:text-indigo-600 focus:outline-none bg-gray-100 border border-gray-300 rounded-full p-1 shadow-sm transition-colors"
                                        title="Reply"
                                    >
                                        <HiOutlineChat className="w-3 h-3" />
                                    </button>
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
                                </>
                            )}
                            {!msg.isDeleted && isSender && (
                                <button
                                    onClick={() => setSelectedMessage({...msg, isReadAll: isReadAll})}
                                    className="text-gray-700 hover:text-indigo-600 focus:outline-none bg-gray-100 border border-gray-300 rounded-full p-1 shadow-sm"
                                    title="Options"
                                >
                                    <HiDotsHorizontal className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default memo(GroupChatMessage);