import React, { memo } from "react";
import { motion } from "framer-motion";
import { BsCheckAll } from "react-icons/bs";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'


const ChatBotMessage = ({
    msg,
    prevDate,
    msgCount,
    formatTime,
    formatFullTimestamp,
}) => {

    return (
        <div id={`msg_${msg?.id}`}>
            {prevDate !== null && (
                <div className="flex items-center justify-center my-4">
                    <hr className="flex-1 border-gray-300" />
                    <span className="px-3 text-xs text-gray-500">{prevDate}</span>
                    <hr className="flex-1 border-gray-300" />
                </div>
            )}

            <div className="flex flex-col gap-2">
                <div className={`flex justify-end relative`}>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`group mb-3.5 p-3 rounded-xl text-sm shadow-md w-fit max-w-[75%] break-words whitespace-pre-wrap relative bg-indigo-100 self-end ${msgCount === 0 && "mt-2"}`}
                    >
                        <div className="text-left">
                            {/* {msg?.repliedMessage && (
                            <div className="border-l-4 border-blue-300 pl-2 mb-2 text-xs text-gray-600 max-h-20 overflow-hidden text-ellipsis line-clamp-3">
                                {msg?.repliedMessage.message}
                            </div>
                        )} */}
                            <div
                                className={`
                                        absolute text-[10px] text-gray-500 bg-white/90 px-2 py-1 rounded-lg shadow 
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                        right-full mr-2 bottom-0 whitespace-nowrap z-10
                                    `}
                            >
                                {formatFullTimestamp(msg?.createdAt || Date.now())}
                            </div>


                            {/* text message */}
                            {msg?.senderMessage && (
                                <div className="mt-0.5">{msg?.senderMessage}</div>
                            )}
                        </div>
                        {/* {!msg?.isDeleted && ( */}
                        <div className={`text-[10px] flex items-center gap-1 pr-0 text-gray-400 justify-end`}>
                            {/* {!!msg?.isEdited && <span className="italic">(edited)</span>} */}
                            <span>{formatTime(msg?.createdAt || Date.now())}</span>
                            <BsCheckAll className="inline-block w-4 h-4 text-[#3B82F6]" />
                            {/* <BsCheck className="inline-block w-4 h-4" /> */}
                        </div>
                        {/* )} */}

                    </motion.div>
                </div>

                {msg.chatbotReply && (
                    <div className={`flex justify-start relative`}>
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`group mb-3.5 p-3 rounded-xl text-sm shadow-md w-fit max-w-full break-words whitespace-pre-wrap relative bg-white self-start`}
                        >
                            <div className="text-left">
                                {/* {msg?.repliedMessage && (
                            <div className="border-l-4 border-blue-300 pl-2 mb-2 text-xs text-gray-600 max-h-20 overflow-hidden text-ellipsis line-clamp-3">
                                {msg?.repliedMessage.message}
                            </div>
                        )} */}
                                <div
                                    className={`
                                        absolute text-[10px] text-gray-500 bg-white/90 px-2 py-1 rounded-lg shadow 
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                        left-full ml-2 bottom-0 whitespace-nowrap z-10
                                    `}
                                >
                                    {formatFullTimestamp(msg?.createdAt || Date.now())}
                                </div>


                                {/* text message */}
                                <div className="mt-0.5">

                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || "")
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={oneLight}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        className="rounded-md max-w-full overflow-x-auto text-xs scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent"
                                                    >
                                                        {children}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm break-words" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg?.chatbotReply || ""}
                                    </ReactMarkdown>

                                </div>
                            </div>
                            {/* {!msg?.isDeleted && ( */}
                            <div className={`text-[10px] flex items-center gap-1 pr-0 text-gray-400 justify-end`}>
                                <span>{formatTime(msg?.createdAt || Date.now())}</span>
                            </div>
                            {/* )} */}
                        </motion.div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default memo(ChatBotMessage);