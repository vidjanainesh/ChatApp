const { Op, Sequelize } = require("sequelize");
const { User } = require("../models");
const sequelize = require("../models/database");

class UserService {
    static async searchUsers(name, currentUserId) {
        const excludedIds = [currentUserId];

        if (currentUserId !== 2) {
            excludedIds.push(1);
        }

        return await User.findAll({
            where: {
                id: {
                    [Op.notIn]: excludedIds,
                },
                is_verified: true,
                name: {
                    [Op.like]: `%${name}%`,
                },
            },
            attributes: ["id", "name", "email",],
        });
    }

    static async findUserById(id) {
        return await User.findOne({
            where: { id, is_verified: true, },
            attributes: ["id", "name", "email"],
        });
    }

    static async getPotentialFriends(currentUserId) {
        const excludedIds = [currentUserId];

        if (currentUserId !== 2) {
            excludedIds.push(1);
        }

        return await sequelize.query(
            `
            SELECT u.id, u.name, u.email
            FROM users u
            WHERE
                u.id NOT IN (:excludedIds)
                AND u.is_verified = true
                AND NOT EXISTS (
                    SELECT 1
                    FROM friends f
                    WHERE (
                        (f.sender_id = :currentUserId AND f.receiver_id = u.id)
                        OR
                        (f.sender_id = u.id AND f.receiver_id = :currentUserId)
                    )
                    AND f.status IN ('pending', 'accepted')
                )
            `,
            {
                replacements: {
                    excludedIds,
                    currentUserId,
                },
                type: Sequelize.QueryTypes.SELECT,
            }
        );
    }
}

module.exports = UserService;