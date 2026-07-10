const UserService = require("../../services/UserService");
const FriendService = require("../../services/FriendService");

module.exports = {
    name: "sendFriendRequest",
    category: "friends",
    description: "Send a friend request to another user.",
    whenToUse: `Use this tool whenever the user wants to become friends with another user.`,
    examples: [
        "Send a friend request to Alice.",
        "Add Bob.",
        "Become friends with Edward.",
        "Connect with Sarah.",
        "Add Mike as a friend."
    ],
    parameters: {
        recipientName: {
            type: "string",
            description: "Name of the user"
        }
    },
    async execute({ user, io, recipientName, }) {

        const users = await UserService.searchUsers(recipientName, user.id);

        if (users.length === 0) {
            return {
                tool: this.name,
                success: false,
                code: "user_not_found",
                data: null,
                error: null,
            };
        }

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

        const relationship = await FriendService.findRelationship(user.id, recipient.id);

        if (relationship) {
            switch (relationship.status) {
                case "accepted":
                    return {
                        tool: this.name,
                        success: false,
                        code: "already_friends",
                        data: recipient,
                        error: null,
                    };

                case "pending":
                    return {
                        tool: this.name,
                        success: false,
                        code: "friend_request_pending",
                        data: recipient,
                        error: null,
                    };
            }

        }

        await FriendService.sendFriendRequest({ senderId: user.id, receiverId: recipient.id, io, });

        return {
            tool: this.name,
            success: true,
            code: "friend_request_sent",
            data: recipient,
            error: null,
        };
    }
};