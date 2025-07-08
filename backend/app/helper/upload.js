const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = "chatapp_uploads";
        return {
            folder,
            resourse_type: "auto",
            public_id: `${Date.now()}-${file.originalname}`,
            resource_type: "auto",
            transformation: [
                { width: 1280, quality: "auto", crop: "limit" }
            ]
        };
    }
});

const upload = multer({ storage });

module.exports = upload;