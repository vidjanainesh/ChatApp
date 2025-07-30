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
            attributes: ['id', 'name', 'phone_no']
        });

        if (!receiver) return errorResponse(res, "Receiver not found");

        // const whatsappPayload = {
        //     phoneNo: '91' + receiver.phone_no,
        //     name: receiver.name,
        //     senderName: user.name,
        //     chatLink: `https://chatapp-frontend-llqt.onrender.com`
        // }

        const fromName = user.name;
        const toName = receiver.name;
        const toPhoneNo = `91` + receiver.phone_no;
        const chatLink = `https://chatapp-frontend-llqt.onrender.com`;

        const payload = {
            messaging_product: 'whatsapp',
            to: toPhoneNo,
            type: "template",
            template: {
                name: "hello_world",
                language: { code: "en_US" },
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