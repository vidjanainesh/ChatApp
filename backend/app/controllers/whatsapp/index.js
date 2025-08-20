const axios = require('axios');

const { errorThrowResponse, successResponse, errorResponse } = require("../../helper/response");
const { User } = require("../../models");

const url = process.env.WHATSAPP_URL;
const token = process.env.WHATSAPP_TOKEN;

const whatsappNotify = async (req, res) => {
    try {
        const user = req.user;
        const receiverId = req.body.receiverId;

        // For whatsapp
        const receiver = await User.findOne({
            where: { id: receiverId },
            attributes: ['id', 'name', ['phone_no', 'phoneNo']],
            raw: true
        });

        if (!receiver) return errorResponse(res, "Receiver not found");

        // const whatsappPayload = {
        //     phoneNo: '91' + receiver.phone_no,
        //     name: receiver.name,
        //     senderName: user.name,
        //     chatLink: `https://chatapp-frontend-llqt.onrender.com`
        // }

        const fromName = user.name?.split(' ')[0] || user.name;
        const toName = receiver.name?.split(' ')[0] || user.name;
        const toPhoneNo = `91` + receiver.phoneNo;
        // const chatLink = `https://chatapp-frontend-llqt.onrender.com`;
        // const chatPath = `chat/${user.id}?name=${encodeURIComponent(user.name)}`;
        const chatPath = `?redirect=${encodeURIComponent(`/chat/${user.id}?name=${user.name}`)}`;

        // const payload = {
        //     messaging_product: 'whatsapp',
        //     to: toPhoneNo,
        //     type: "template",
        //     template: {
        //         name: "hello_world",
        //         language: { code: "en_US" },
        //     }
        // };

        const payload = {
            messaging_product: "whatsapp",
            to: toPhoneNo,
            type: "template",
            template: {
                name: "notifications_private_messages",
                language: { code: "en" },
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: toName },     // {{1}} -> receiver’s name
                            { type: "text", text: fromName }    // {{2}} -> sender’s name
                        ]
                    },
                    {
                        type: "button",                         // View Messages - button
                        sub_type: "url",
                        index: "0",
                        parameters: [
                            { type: "text", text: chatPath }    // dynamic link
                        ]
                    }
                ]
            }
        };

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        await axios.post(url, payload, { headers });

        return successResponse(res, {}, "Whatsapp message sent");

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    whatsappNotify
};