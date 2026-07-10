const UserService = require("../../services/UserService");

module.exports = {
    name: "getFriends",
    category: "friends",
    description: "Returns all friends of the currently logged in user.",
    whenToUse: `Use this tool whenever the user wants information about their friends. Do not use this tool for sending messages or managing friend requests.`,
    examples: [
        "Who are my friends?",
        "Show my friends.",
        "List all my friends.",
        "How many friends do I have?",
        "Am I friends with anyone?",
        "Can you show my friend list?",
        "Who have I added as friends?",
        "Give me the names of my friends.",
        "Who can I message?",
        "Show everyone I'm connected with."
    ],
    parameters: {},
    async execute({ user }) {
        try {
            const friends = await UserService.getFriends(user.id);

            return {
                tool: this.name,
                success: true,
                code: friends.length ? "friends_found" : "no_friends",
                data: friends,
                error: null,
            };
        } catch (err) {
            return {
                tool: this.name,
                success: false,
                code: "internal_error",
                data: null,
                error: err.message,
            };
        }
    }
};