import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getMessages, sendMessage } from "../../api";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

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
  const socketRef = useRef(null);
  const chatWindowRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io("https://chatapp-ebgg.onrender.com", {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("newMessage", (newMessage) => {
      const receiverIdStr = String(newMessage.receiver_id);
      const senderIdStr = String(newMessage.sender_id);

      if (
        (senderIdStr === String(loggedInUserId) && receiverIdStr === id) ||
        (receiverIdStr === String(loggedInUserId) && senderIdStr === id)
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    socketRef.current.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    socketRef.current.on("typing", ({ senderId, receiverId, isTyping }) => {
      // Only show typing if the typing user is the one we're chatting with
      if (senderId === parseInt(id) && receiverId === loggedInUserId) {
        setIsTyping(isTyping);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id, loggedInUserId, token]);

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
  }, [id]); // refetch messages if id changes

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const response = await sendMessage(input, id, token);
      if (response.data.status !== "success") {
        toast.error("Could not send message", { autoClose: 3000 });
      } else {
        setInput("");
        // Optionally you can push the sent message optimistically, but the socket will add it anyway
        // setMessages(prev => [...prev, response.data.sentMessage]);
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

  return (
    <div className="chat-container">
      <h2 className="chat-title">Chat with {name}</h2>
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg) => {
          const isSender = msg.sender_id === loggedInUserId;
          return (
            <div
              key={msg.id}
              className={`chat-message ${isSender ? "sender" : "receiver"}`}
            >
              <div>{msg.message}</div>
              <div className="chat-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
        {isTyping && <div className="typing-indicator">Typing...</div>}
      </div>
      <br />
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
          
        <button type="submit" className="chat-send-button">
          Send
        </button>
      </form>
    </div>
  );
}