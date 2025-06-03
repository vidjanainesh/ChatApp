const jwt = require('jsonwebtoken');
const User = require('../../models/users');

const bcrypt = require('bcrypt');

const register = async (req, res) => {
    try {
        
        // console.log(req.body);
        const {name, email, password} = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log(hashedPassword);
        
        const user = await User.findOne({
            where: {email: email},
            raw: true
        });

        if(user){
            throw new Error('User with the same email already exists')
        }
        
        await User.create({
            name,
            email,
            password: hashedPassword,
        });
        
        res.status(201).json({
            status: "success",
            message: "User Registered"
        });
        

    } catch (error) {
        res.status(400).json({
            status: "error",
            message: `${error.message}`
        });
    }

}

const login = async (req, res) => {
    try {
        // console.log(req.body);
        const {email, password} = req.body;

        const user = await User.findOne({
            where: {email: email},
            raw: true
        });

        if(!user) throw new Error('No users with given email exists!');

        // console.log(user);
        // console.log(hashedPassword);

        const match = await bcrypt.compare(password, user.password);

        const userToken = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '1hr'});

        if(match){
            res.status(200).json({
                status: "success",
                message: "User Logged In",
                userToken
            });
        }
        else{
            throw new Error('Password did not match');            
        }

    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
}

module.exports = {
    register,
    login
};