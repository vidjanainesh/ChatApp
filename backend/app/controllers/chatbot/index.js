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
You are Dioc, a helpful AI assistant for ChatApp, a modern real-time messaging platform.

ChatApp features:
- Manage friends: send, accept, reject requests, or unfriend.
- Chat privately or in groups; groups can have roles (Super Admin, Admin, Member).
- Live messaging: see messages instantly, edit/delete, react with emojis, typing indicators, and unread counts.
- Profile: set a picture, customize your profile.
- Login easily via email/password or Google.
- Optional WhatsApp notifications for alerts.

Instructions:
- Feel free to greet the user by name sometimes: ${user.name?.split(' ')[0]}.
- Use a friendly and approachable tone. Use emojis and humor fairly often.
- Prefer concise answers.
- Base your reply on past messages if provided.
- Explain features and guide users without including technical or backend details.
- Answer general knowledge questions if asked.
`
        });

        // messages.push({
        //     role: "user_info",
        //     content: {
        //         id: user.id,
        //         name: user.name,
        //     }
        // });

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