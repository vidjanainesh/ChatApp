const GroupService = require("../../services/GroupService");

module.exports = {
    name: "getGroups",
    category: "groups",
    description: "Returns all groups that the currently logged in user is a member of.",
    whenToUse: `Use this tool whenever the user wants information about their chat groups. Do not use this tool for creating groups or sending messages.`,
    examples: [
        "Show my groups.",
        "Which groups am I in?",
        "List all my groups.",
        "What group chats do I have?",
        "Show my team chats.",
        "Am I part of any groups?",
        "Which group conversations do I belong to?",
        "Display my group list.",
        "What are my chat groups?",
        "Show all the groups I'm a member of."
    ],
    parameters: {},
    async execute({ user }) {
        try {
            const groups = await GroupService.getGroups(user.id);

            return {
                tool: this.name,
                success: true,
                code: groups.length ? "groups_found" : "no_groups",
                data: groups,
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