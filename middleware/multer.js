const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '../uploads'));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const fileExtension = path.extname(file.originalname);
		cb(null, `image-${uniqueSuffix}${fileExtension}`);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
			file.mimetype
		)
	) {
		cb(null, true);
	} else {
		cb(new Error('Unsupported file type'), false);
	}
};

const upload = multer({
	storage,
	limits: {
		fileSize: 2 * 1024 * 1024,
	},
	fileFilter,
});


module.exports = upload
