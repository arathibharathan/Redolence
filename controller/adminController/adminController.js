const adminSchema = require('../../model/userModel');
const adminRouter = require('../../router/adminRouter');
const Category = require('../../model/categoryModel');
const productSchema = require('../../model/productModel');

const getLoginPage = async (req, res) => {
	try {
		res.render('adminLog');
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Internal Server Error', message: error.message });
	}
};

const adminCheck = async (req, res) => {
	try {
		const { username, password } = req.body;
		let adminCheck = await adminSchema.findOne({ username: username });
		if (adminCheck === null) {
			return res
				.status(400)
				.json({ success: false, message: 'User not Found!' });
		} else if (adminCheck.password !== password) {
			return res
				.status(400)
				.json({ success: false, message: 'password not mathching ' });
		} else if (adminCheck.is_admin === false) {
			return res.status(400).json({ success: false, message: 'not an admin ' });
		} else {
			req.session.admin = adminCheck;
			return res
				.status(200)
				.json({ success: true, message: 'signin successful' });
		}
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Internal Server Error', message: error.message });
	}
};









module.exports = {
	getLoginPage,
	adminCheck
};
