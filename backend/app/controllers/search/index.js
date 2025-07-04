const {User} = require('../../models');

const searchUsers = async (req, res) => {
    try {
        const { input } = req.body;

        const users = await User.findAll({
            
        });

        return success
    } catch (error) {
        
    }
}

module.exports = {
    searchUsers
};