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
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                messages: [
                    {
                        role: "user",
                        content: msg,
                    },
                ],
                model: "openai/gpt-oss-120b:sambanova",
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

        return successResponse(res, successObj, 'Received reply from Chatbot')

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