const UserService = require("../../services/UserService");

module.exports = {
    name: "getPotentialFriends",
    category: "friends",
    description: "Returns users that the current user can send a friend request to.",
    whenToUse: `Use this tool whenever the user wants to discover people they can send friend requests to.`,
    examples: [
        "Show me all the users",
        "Who can I add as a friend?",
        "Show users I can send friend requests to.",
        "Who isn't my friend yet?",
        "Show potential friends.",
        "Who can I connect with?"
    ],
    parameters: {},
    async execute({ user }) {
        try {
            const users = await UserService.getPotentialFriends(user.id);

            return {
                tool: this.name,
                success: true,
                code: users.length ? "potential_friends_found" : "no_potential_friends",
                data: users,
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
    },
};