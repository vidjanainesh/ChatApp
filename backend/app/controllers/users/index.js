const { Sequelize } = require("sequelize");
const { successResponse, errorThrowResponse } = require("../../helper/response");
const sequelize = require("../../models/database");

const getUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const baseExclusions = [currentUserId];
        if (currentUserId !== 2) {
            baseExclusions.push(1);
        }

        const users = await sequelize.query(`
            SELECT u.id, u.name, u.email
            FROM users u
            WHERE u.id NOT IN (:excludedIds)
            AND NOT EXISTS (
                SELECT 1 FROM friends f
                WHERE (
                    (f.sender_id = :currentUserId AND f.receiver_id = u.id)
                    OR
                    (f.sender_id = u.id AND f.receiver_id = :currentUserId)
                )
                AND f.status IN ('pending', 'accepted')
            )
        `, {
            replacements: {
                excludedIds: baseExclusions,
                currentUserId
            },
            type: Sequelize.QueryTypes.SELECT
        });

        return successResponse(res, users, "Fetched eligible users");

    } catch (error) {
        // console.error(error);
        return errorThrowResponse(res, error.message, error);
    }
};

const searchUsers = async (req, res) => {
    try {
        const { input } = req.body;
        const currentUserId = req.user.id;

        const baseExclusions = [currentUserId];
        if (currentUserId !== 2) {
            baseExclusions.push(1);
        }

        const users = await sequelize.query(`
            SELECT u.id, u.name, u.email
            FROM users u
            WHERE u.id NOT IN (:excludedIds)
            AND NOT EXISTS (
                SELECT 1 FROM friends f
                WHERE (
                    (f.sender_id = :currentUserId AND f.receiver_id = u.id)
                    OR
                    (f.sender_id = u.id AND f.receiver_id = :currentUserId)
                )
                AND f.status IN ('pending', 'accepted')
            )
            AND (u.name LIKE :search OR u.email LIKE :search)
        `, {
            replacements: {
                excludedIds: baseExclusions,
                currentUserId,
                search: `%${input}%`
            },
            type: Sequelize.QueryTypes.SELECT
        });

        return successResponse(res, users, "Fetched matching users");
    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
};


module.exports = {
    getUsers,
    searchUsers
};