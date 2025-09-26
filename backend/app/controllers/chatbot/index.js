const { encryptMessage } = require("../../helper/encryption");
const { errorThrowResponse, successResponse, errorResponse } = require("../../helper/response");
const axios = require('axios');
const ChatbotMessages = require("../../models/chatbotMessages");
const { Op, where } = require("sequelize");

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

const sendChatbotMessage = async (req, res) => {
    try {
        const { msg } = req.body;
        const user = req.user;

        const history = await ChatbotMessages.findAll({
            where: { sender_id: user.id },
            attributes: ['id', 'sender_id', 'sender_message', 'chatbot_reply'],
            order: [['id', 'DESC']],
            limit: 3,
        });

        const messages = [];

        messages.push({
            role: "system",
            content: `
                    You are Dioc, a helpful AI assistant specifically designed for a real-time chat application called ChatApp.

                    ChatApp features include:
                    - Users can start by sending a friend request to another user, and start chatting once request is accepted.
                    - User authentication with email/password and Google OAuth.
                    - Private messaging and group chats with roles (Super Admin, Admin, Members).
                    - Friend management: send, accept, reject requests, unfriend.
                    - Real-time messaging with edits, deletes, emoji reactions, typing indicators, and unread message tracking.
                    - Profile management and image uploads.
                    - Optional WhatsApp notifications.
                    - All messages are securely encrypted in the database.
                    - Frontend is built with React, Tailwind CSS, Framer Motion, and Toast notifications.
                    - Backend uses Node.js, Express, PostgreSQL via Sequelize, JWT authentication, and Socket.IO for real-time updates.

                    Instructions:
                    - Use a friendly and approachable tone in every message.
                    - Prefer concise answers when possible.
                    - Answer in the context of past messages if applicable.
                    - A list of past messages will be sent along with a new message, answer based on the history.
                    - You can explain features, help users understand how to perform actions, and guide them if they have questions about ChatApp but no need to include technical terms and working of the application to the response.
                    - Answer in context of ChatApp wherever applicable; do not provide generic answers about unrelated chat applications.
                    - You may also answer general knowledge questions.
                    - When a user is talking to you for the first time, always introduce yourself.
                    `
            // - You may suggest frontend or backend features only if relevant to ChatApp functionality.
        });

        history.reverse().map((h) => {
            messages.push(
                { role: 'user', content: h.sender_message },
                { role: 'assistant', content: h.chatbot_reply }
            );
        })

        messages.push({ role: 'user', content: msg });

        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                messages,
                model: "openai/gpt-oss-120b:sambanova",
                temperature: 0.9
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`
                }
            }
        )

        const botReply = response.data.choices[0].message.content || `I didn't quite get it`;

        // let encryptedData, iv;
        // if (msg) {
        //     const encryption = encryptMessage(msg);
        //     encryptedData = encryption.encryptedData;
        //     iv = encryption.iv;
        // }

        const chatbotMessage = await ChatbotMessages.create({
            sender_id: user.id,
            sender_message: msg,
            chatbot_reply: botReply,
        });

        const successObj = {
            id: chatbotMessage.id,
            senderId: user.id,
            senderMessage: msg,
            chatbotReply: botReply,
            iv: null,
            conversationId: null,
            createdAt: chatbotMessage.createdAt,
        }

        return successResponse(res, successObj, 'Received reply from Chatbot');

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const getChatbotMessages = async (req, res) => {
    try {
        const user = req.user;
        const beforeId = req.query.beforeId;

        const whereClause = {
            sender_id: user.id
        }

        if (beforeId) {
            whereClause.id = { [Op.lt]: beforeId }
        }

        const messages = await ChatbotMessages.findAll({
            where: whereClause,
            attributes: [
                'id',
                ['sender_id', 'senderId'],
                ['sender_message', 'senderMessage'],
                ['chatbot_reply', 'chatbotReply'],
                'iv',
                ['conversation_id', 'conversationId'],
                "createdAt",
            ],
            limit: 4,
            order: [['id', 'DESC']]
        });

        // const response = messages.map((msg) => ({
        //     ...msg,
        //     temp: false,
        // }))

        // if (!messages) return errorResponse(res, "No messages exist")

        return successResponse(res, messages.reverse(), "Fetched messages with chatbot successfully");

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    sendChatbotMessage,
    getChatbotMessages
};