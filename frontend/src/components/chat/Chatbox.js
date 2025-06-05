import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage } from "../../api";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import useSocket from "../../hooks/useSocket";

export default function Chatbox() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name");

  let loggedInUserId = null;
  const token = localStorage.getItem("jwt");

  try {
    const decoded = jwtDecode(token);
    loggedInUserId = decoded.id;
  } catch (error) {
    localStorage.removeItem("jwt");
    toast.error("Invalid session. Please log in again.", { autoClose: 3000 });
    navigate("/");
  }

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatWindowRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socketRef = useSocket({
    id,
    token,
    loggedInUserId,
    setMessages,
    setIsTyping,
  });

  const fetchMessages = async () => {
    try {
      const response = await getMessages(id, token);
      if (response.data.status !== "success") {
        toast.error(response.data.message || "Failed to retrieve messages", {
          autoClose: 3000,
        });
      } else {
        setMessages(response.data.data);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to retrieve messages";

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

  useEffect(() => {
    fetchMessages();
  }, [id]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const response = await sendMessage(input, id, token);
      if (response.data.status !== "success") {
        toast.error("Could not send message", { autoClose: 3000 });
      } else {
        setInput("");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong while sending message";
      if (errorMessage === "Invalid or expired token") {
        localStorage.removeItem("jwt");
        navigate("/");
      } else {
        toast.error(errorMessage, { autoClose: 3000 });
      }
    }
  };

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (socketRef.current) {
      socketRef.current.emit("typing", {
        senderId: loggedInUserId,
        receiverId: parseInt(id),
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("typing", {
          senderId: loggedInUserId,
          receiverId: parseInt(id),
          isTyping: false,
        });
      }, 1500);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  return (
    <>
      <div>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back
        </button>
      </div>
      <div className="chat-container">
        <h2 className="chat-title">Chat with {name}</h2>
        <div className="chat-window" ref={chatWindowRef}>
          {messages.length > 0 && messages.map((msg, idx) => {
            const isSender = msg.sender_id === loggedInUserId;
            const currentDate = formatDate(msg.timestamp);
            const prevDate = idx > 0 ? formatDate(messages[idx - 1].timestamp) : null;

            return (
              <React.Fragment key={msg.id}>
                {prevDate && currentDate !== prevDate && (
                  <div className="date-separator-container">
                    <hr className="date-separator-line left" />
                    <span className="date-separator-text">{currentDate}</span>
                    <hr className="date-separator-line right" />
                  </div>
                )}
                <div className={`chat-message ${isSender ? "sender" : "receiver"}`}>
                  <div>{msg.message}</div>
                  <div className="chat-timestamp">{formatTime(msg.timestamp)}</div>
                </div>
              </React.Fragment>
            );
          })}
          {isTyping && <div className="typing-indicator">Typing...</div>}
        </div>

        <form onSubmit={submitHandler} className="chat-input-form">
          <input
            type="text"
            placeholder="Start typing..."
            name="input"
            value={input}
            onChange={handleInputChange}
            className="chat-input"
            autoComplete="off"
          />
          <button type="submit" className="chat-send-button" aria-label="Send message">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              style={{ display: 'block' }}
            >
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}