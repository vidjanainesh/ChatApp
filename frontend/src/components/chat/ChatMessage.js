import React, { memo } from "react";
import { motion } from "framer-motion";
import { HiDotsHorizontal, HiOutlineChat, HiEmojiHappy, HiPlusSm, HiDownload, HiPhotograph, HiVideoCamera } from "react-icons/hi";
import EmojiPicker from "emoji-picker-react";
import { BsCheck, BsCheckAll } from "react-icons/bs";

const ChatMessage = ({
    msg,
    prevDate,
    isSender,
    userReaction,
    availableReactions,
    onReact,
    onReply,
    onEdit,
    onDelete,
    reactionPickerId,
    setReactionPickerId,
    showFullEmojiPickerId,
    setShowFullEmojiPickerId,
    reactionPickerRef,
    fullReactionPickerRef,
    formatTime,
    selectedMessage,
    setSelectedMessage,
    loggedInUserId,
    downloadedFile,
    onDownload,
}) => {
    return (
        <div id={`msg_${msg.id}`}>
            {prevDate !== null && (
                <div className="flex items-center justify-center my-4">
                    <hr className="flex-1 border-gray-300" />
                    <span className="px-3 text-xs text-gray-500">{prevDate}</span>
                    <hr className="flex-1 border-gray-300" />
                </div>
            )}

            <div className={`flex ${isSender ? "justify-end" : "justify-start"} relative`}>
                <motion.div
                    initial={{ opacity: 0, x: isSender ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group mb-2 p-3 rounded-xl text-sm shadow-md w-fit max-w-[75%] break-words whitespace-pre-wrap relative ${isSender ? "bg-indigo-100 self-end" : "bg-white self-start"}`}
                >
                    <div className="text-left">
                        {msg.isDeleted ? (
                            <span className="italic text-gray-400">This message was deleted</span>
                        ) : (
                            <>
                                {msg.repliedMessage && (
                                    <div className="border-l-4 border-blue-300 pl-2 mb-2 text-xs text-gray-600">
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
                                            onClick={() => downloadedFile && window.open(downloadedFile?.url, "_blank")}
                                        />

                                        {!downloadedFile?.url && (
                                            <>
                                                <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded">
                                                    <HiPhotograph className="w-5 h-5" />
                                                </div>
                                                <button
                                                    onClick={() => onDownload(msg)}
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
                        <div className={`text-[10px] flex items-center gap-1 pr-0 text-gray-400 ${isSender ? 'justify-end' : 'justify-start'}`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {!!msg.isEdited && <span className="italic">(edited)</span>}
                            {isSender && (
                                <span
                                    style={{ color: msg.isRead ? "#3B82F6" : "#9CA3AF" }}
                                >
                                    {msg.isRead ? (
                                        <BsCheckAll className="inline-block w-4 h-4" />
                                    ) : (
                                        <BsCheck className="inline-block w-4 h-4" />
                                    )}
                                </span>
                            )}
                        </div>
                    )}

                    {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                        <div className={`absolute -bottom-3 ${isSender ? '-left-2' : '-right-2'} flex flex-wrap gap-1 max-w-[200px]`}>
                            {Object.entries(
                                msg.reactions.reduce((acc, r) => {
                                    acc[r.reaction] = acc[r.reaction] || [];
                                    acc[r.reaction].push(r);
                                    return acc;
                                }, {})
                            ).map(([emoji, reactions]) => (
                                <button
                                    key={emoji}
                                    onClick={() => onReact(msg.id, emoji, userReaction)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all duration-200 shadow-md border-2 backdrop-blur-sm ${reactions.some(r => r.userId === loggedInUserId)
                                        ? 'bg-indigo-100/90 text-indigo-800 border-indigo-200 hover:bg-indigo-200/90'
                                        : 'bg-white/90 text-gray-600 border-gray-200 hover:bg-gray-50/90 hover:shadow-lg'
                                        } transform hover:scale-105`}
                                    title={reactions.map(r => r.userName?.split(' ')[0] || 'Someone').join(', ')}
                                >
                                    <span className="text-[12px]">{emoji}</span>
                                    {reactions.length > 1 && (
                                        <span className="font-semibold min-w-[12px] text-center text-[10px]">{reactions.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

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
                                        onReact(msg.id, emoji, userReaction);
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

                    {showFullEmojiPickerId === msg.id && (
                        <div className={`absolute ${isSender ? 'right-0' : 'left-0'} bottom-full mb-2 z-30`}>
                            <div
                                ref={fullReactionPickerRef}
                                style={{ transform: "scale(0.6)", transformOrigin: isSender ? 'bottom right' : 'bottom left' }}
                            >
                                <EmojiPicker
                                    onEmojiClick={(emojiData) => onReact(msg.id, emojiData.emoji, userReaction)}
                                    theme="light"
                                />
                            </div>
                        </div>
                    )}

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
                                onClick={() => setSelectedMessage(msg)}
                                className="text-gray-700 hover:text-indigo-600 focus:outline-none bg-gray-100 border border-gray-300 rounded-full p-1 shadow-sm"
                                title="Options"
                            >
                                <HiDotsHorizontal className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default memo(ChatMessage);