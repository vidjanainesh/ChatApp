module.exports = {

    getFriends: {

        friends_found: {
            context: "The user's friends were retrieved successfully.",
            responseGuidance: "Answer using the friend list. Mention only information relevant to the user's request."
        },

        no_friends: {
            context: "The user does not have any friends yet.",
            responseGuidance: "Tell the user they don't have any friends yet. If appropriate, suggest sending friend requests."
        },

        internal_error: {
            context: "An unexpected error occurred while retrieving friends.",
            responseGuidance: "Apologize briefly and ask the user to try again."
        }

    },

    getGroups: {

        groups_found: {
            context: "The user's groups were retrieved successfully.",
            responseGuidance: "Answer using the group list."
        },

        no_groups: {
            context: "The user is not a member of any groups.",
            responseGuidance: "Tell the user they aren't part of any groups yet."
        },

        internal_error: {
            context: "An unexpected error occurred while retrieving groups.",
            responseGuidance: "Apologize briefly and ask the user to try again."
        }

    },

    createGroup: {

        group_created: {
            explanation: "The group was created successfully.",
            instruction: "Confirm that the group was created successfully."
        },

        members_not_friends: {
            explanation: "One or more selected members are not friends with the user.",
            instruction: "Explain that groups can only include friends. Tell the user to send friend requests first."
        },

        user_not_found: {
            explanation: "One of the supplied member names could not be found.",
            instruction: "Tell the user which name could not be found and ask them to try again."
        },

        multiple_matches: {
            explanation: "One of the supplied names matched multiple users.",
            instruction: "Ask the user which person they meant before creating the group."
        },

        internal_error: {
            explanation: "An unexpected error occurred while creating the group.",
            instruction: "Apologize briefly and ask the user to try again."
        }

    },

    getPotentialFriends: {

        potential_friends_found: {
            context: "Users eligible to receive friend requests were found.",
            responseGuidance: "Present the list naturally."
        },

        no_potential_friends: {
            context: "There are no eligible users to send friend requests to.",
            responseGuidance: "Explain that there are currently no users available to add."
        },

        internal_error: {
            context: "An unexpected error occurred while retrieving eligible users.",
            responseGuidance: "Apologize briefly and ask the user to try again."
        }

    },

    sendFriendRequest: {

        friend_request_sent: {
            context: "The friend request was sent successfully.",
            responseGuidance: "Confirm that the friend request has been sent."
        },

        already_friends: {
            context: "The selected user is already one of the user's friends.",
            responseGuidance: "Tell the user they are already friends. Do not suggest sending another friend request."
        },

        friend_request_pending: {
            context: "A friend request already exists.",
            responseGuidance: "Inform the user that a friend request is already pending."
        },

        friend_request_rejected: {
            context: "A previous friend request had been rejected.",
            responseGuidance: "Explain that a previous request was rejected."
        },

        user_not_found: {
            context: "No matching user could be found.",
            responseGuidance: "Tell the user no matching user was found."
        },

        multiple_matches: {
            context: "Multiple users matched the supplied name.",
            responseGuidance: `
Do not guess which user the sender intended.

Present the matching users using only the information needed to distinguish
them (for example their name or email).

Ask the user which one they meant before taking any further action.

Do not execute the action until the ambiguity is resolved.
`
        },

        internal_error: {
            context: "An unexpected error occurred while sending the friend request.",
            responseGuidance: "Apologize briefly and ask the user to try again."
        }

    },

    sendMessage: {

        message_sent: {
            context: "The message was delivered successfully.",
            responseGuidance: "Confirm that the message has been sent."
        },

        not_friends: {
            context: "The recipient is not one of the user's friends.",
            responseGuidance: "Explain that messages can only be sent to friends. Ask whether the user would like to send a friend request."
        },

        user_not_found: {
            context: "No matching user could be found.",
            responseGuidance: "Tell the user no matching user was found."
        },

        multiple_matches: {
            context: "Multiple users matched the supplied name.",
            responseGuidance: "Ask the user which person they meant. Do not guess."
        },

        internal_error: {
            context: "An unexpected error occurred while sending the message.",
            responseGuidance: "Apologize briefly and ask the user to try again."
        }

    },
};