const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = "chatapp_uploads";
        return {
            folder,
            public_id: `${Date.now()}-${file.originalname}`,
            resource_type: "auto",
            transformation: [
                { width: 1280, quality: "auto", crop: "limit" }
            ]
        };
    }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const messageTypes = [...imageTypes, 'video/mp4', 'video/quicktime', 'application/pdf'];

    const context = req.uploadType;

    let allowedTypes;

    if (context === 'profile') {
        allowedTypes = imageTypes;
    } else if (context === 'message') {
        allowedTypes = messageTypes;
    } else {
        return cb(new Error('Unknown upload context.'), false);
    }

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images, videos, and PDFs are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    // limits: { fileSize: 15 * 1024 * 1024 }
});

module.exports = upload;