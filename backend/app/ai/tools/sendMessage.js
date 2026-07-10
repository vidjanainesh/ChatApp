const UserService = require("../../services/UserService");
const FriendService = require("../../services/FriendService");
const MessageService = require("../../services/MessageService");

module.exports = {
    name: "sendMessage",
    category: "messaging",
    description: "Send a private message to one of the user's friends.",
    whenToUse: `Use this tool whenever the user wants ChatApp to deliver a message to another user.  Even if the user does not explicitly say "send a message", choose this tool whenever their intent is to communicate with another user.`,
    examples: [
        "Send a message to Alice.",
        "Message Bob.",
        "Tell John I'm running late.",
        "Ask Edward if he finished yesterday's work.",
        "Wish Sarah happy birthday.",
        "Let Mike know the meeting is cancelled.",
        "Inform Jane about the update.",
        "Tell Alice I'll be there in 10 minutes.",
        "Ask Bob whether he's free this evening.",
        "Remind John about tomorrow's meeting."
    ],
    parameters: {
        recipientName: {
            type: "string",
            description: "Name of the friend"
        },
        message: {
            type: "string",
            description: "Message to send"
        }
    },
    async execute({ user, io, recipientName, message }) {

        const users = await UserService.searchUsers(recipientName, user.id);

        // 0 matches
        if (users.length === 0) {
            return {
                tool: this.name,
                success: false,
                code: "user_not_found",
                data: null,
                error: null,
            };
        }

        // Multiple matches
        if (users.length > 1) {
            return {
                tool: this.name,
                success: false,
                code: "multiple_matches",
                data: users,
                error: null,
            };
        }

        const recipient = users[0];

        const friendship = await FriendService.getFriendship(user.id, recipient.id);

        if (!friendship) {
            return {
                tool: this.name,
                success: false,
                code: "not_friends",
                data: recipient,
                error: null,
            };
        }

        const payload = await MessageService.sendMessage({
            sender: user,
            receiverId: recipient.id,
            message,
            io,
        });

        return {
            tool: this.name,
            success: true,
            code: "message_sent",
            data: payload,
            error: null,
        };
    }
};