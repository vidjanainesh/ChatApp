const UserService = require("../../services/UserService");
const FriendService = require("../../services/FriendService");
const GroupService = require("../../services/GroupService");

module.exports = {
    name: "createGroup",
    category: "groups",
    description: "Create a new group chat with the user's friends.",
    whenToUse: `Use this tool whenever the user wants to create a new chat group.`,
    examples: [
        "Create a group called Weekend Trip with Alice and Bob.",
        "Make a new group named Office with Edward and John.",
        "Create a family group.",
        "Start a new chat group with Alice, Bob and Charlie.",
        "Create a group called Project Team."
    ],
    parameters: {
        groupName: {
            type: "string",
            description: "Name of the new group"
        },
        members: {
            type: "array",
            items: {
                type: "string"
            },
            description: "Names of users to add to the group"
        }
    },

    async execute({ user, io, groupName, members }) {
        try {
            const membersInfo = [];

            for (const memberName of members) {

                const users = await UserService.searchUsers(memberName, user.id);

                if (users.length === 0) {
                    return {
                        tool: this.name,
                        success: false,
                        code: "user_not_found",
                        data: { memberName },
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

                membersInfo.push(users[0]);
            }

            const validation = await FriendService.validateFriends(user.id, membersInfo);

            if (!validation.valid) {
                return {
                    tool: this.name,
                    success: false,
                    code: "members_not_friends",
                    data: validation.invalidMembers,
                    error: null,
                };
            }

            const group = await GroupService.createGroup({
                name: groupName,
                memberIds: membersInfo.map(member => member.id),
                creator: user,
                io,
            });

            return {
                tool: this.name,
                success: true,
                code: "group_created",
                data: group,
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