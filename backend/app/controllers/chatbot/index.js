const { encryptMessage } = require("../../helper/encryption");
const { errorThrowResponse, successResponse, errorResponse } = require("../../helper/response");
const axios = require('axios');
const ChatbotMessages = require("../../models/chatbotMessages");
const { Op, where } = require("sequelize");
const tools = require("../../ai/helper/toolRegistry");
const executeTool = require("../../ai/helper/toolExecutor");
const buildInternalContext = require("../../ai/helper/buildInternalContext");
const routeTool = require("../../ai/helper/toolRouter");

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

const sendChatbotMessage = async (req, res) => {
    try {
        const { msg } = req.body;
        const user = req.user;

        const historyData = await ChatbotMessages.findAll({
            where: { sender_id: user.id },
            attributes: ['id', 'sender_id', 'sender_message', 'chatbot_reply'],
            order: [['id', 'DESC']],
            limit: 5,
        });

        const history = historyData.reverse().flatMap((h) => [
            { role: 'user', content: h.sender_message },
            { role: 'assistant', content: h.chatbot_reply }
        ])

        const messages = [];

        // ========== Agentic AI flow =============

        // Use toolRouter
        const routing = await routeTool(msg, history);
        console.log("Routing: ", routing);

        // The tool's actual result
        let toolResult = null;

        // Match tool from registry
        const toolExists = tools[routing.tool];

        // Execute the actual tool
        if (toolExists && routing.confidence >= 0.8) {
            toolResult = await executeTool(routing.tool, {
                user,
                io: req.app.get("io"),
                ...routing.arguments,
            });
        }
        // =========================================

        console.log("ToolResult: ", toolResult)
        const systemPrompt = `
You are Dioc, a helpful AI assistant for ChatApp, a modern real-time messaging platform.

ChatApp features:
- Manage friends: send, accept, reject requests, or unfriend.
- Chat privately or in groups; groups can have roles (Super Admin, Admin, Member).
- Live messaging: see messages instantly, edit/delete, react with emojis, typing indicators, and unread counts.
- Profile: set a picture, customize your profile.
- Login easily via email/password or Google.
- Optional WhatsApp notifications for alerts.

Instructions:
- Feel free to greet the user by name sometimes: ${user.name?.split(' ')[0]}. Avoid calling them by name in consecutive replies.
- Use a friendly and approachable tone. Use emojis and humor fairly often.
- Prefer concise answers.
- Base your reply on past messages if provided.
- Explain features and guide users without including technical or backend details.
- Answer general knowledge questions if asked.

${toolResult ? buildInternalContext(toolResult) : ""}

`;

        messages.push({
            role: "system",
            content: systemPrompt
        });

        // messages.push({
        //     role: "user_info",
        //     content: {
        //         id: user.id,
        //         name: user.name,
        //     }
        // });

        messages.push(...history);
        messages.push({ role: 'user', content: msg });

        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                messages,
                model: "meta-llama/Llama-3.1-8B-Instruct",
                temperature: 0.4
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
        console.log("Error: ", error?.response?.data);
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