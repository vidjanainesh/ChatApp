const { User } = require("../../models");
const { errorResponse, successResponse, errorThrowResponse } = require("../../helper/response");
const jwt = require('jsonwebtoken');

const viewProfile = async (req, res) => {
    try {
        const id = req.user.id;

        const userDetails = await User.findOne({
            where: { id },
            attributes: [
                'id',
                'name',
                'email',
                'dob',
                'gender',
                'address',
                ['phone_no', 'phoneNo'],
                ['profile_image_url', 'profileImageUrl'],
                ['profile_image_type', 'profileImageType'],
                ['profile_image_name', 'profileImageName'],
                ['profile_image_size', 'profileImageSize'],
                ['profile_image_blur_url', 'profileImageBlurUrl'],
            ]
        });
        if (!userDetails) return errorResponse(res, "User not found");

        return successResponse(res, userDetails, "Successfully fetched user details");

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

const editProfile = async (req, res) => {
    try {
        // console.log(req.body);
        const userEmail = req.user.email;

        const name = req.body?.name;
        const phone_no = req.body?.phoneNo;
        const dob = req.body?.dob;
        const address = req.body?.address;
        const gender = req.body?.gender;

        const file = req?.file;

        const user = await User.findOne({ where: { email: userEmail } });
        if (!user) return errorResponse(res, "User not found");

        if (name) user.name = name;
        if (phone_no) user.phone_no = phone_no;
        if (dob) user.dob = dob;
        if (gender) user.gender = gender;
        if (address) user.address = address;

        if (file) {
            user.profile_image_url = file.path;
            user.profile_image_type = "image";
            user.profile_image_name = file.originalname;
            user.profile_image_size = file.size;

            // // generate blur url using public_id
            // const publicId = `${file.filename}`; // 'chatapp_uploads/...'
            // fileBlurUrl = cloudinary.url(publicId, {
            //     transformation: [
            //         { width: 20, quality: "auto" },
            //         { effect: "blur:500" }
            //     ],
            //     format: "jpg",
            //     secure: true,
            // });
        }

        await user.save();

        const userToken = {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNo: user.phone_no,
            profileImageUrl: user.profile_image_url,
        }
        const token = jwt.sign(userToken, process.env.JWT_SECRET);

        const userDetails = {
            id: user.id,
            name: user.name,
            email: user.email,
            dob: user.dob,
            gender: user.gender,
            address: user.address,
            phoneNo: user.phone_no,
            profileImageUrl: user.profile_image_url,
            profileImageType: user.profile_image_type,
            profileImageName: user.profile_image_name,
            profileImageSize: user.profile_image_size,
            profileImageBlurUrl: user.profile_image_blur_url
        }

        return successResponse(res, { user: userDetails, token }, 'Successfully updated the profile');

    } catch (error) {
        return errorThrowResponse(res, error.message, error);
    }
}

module.exports = {
    viewProfile,
    editProfile,
}