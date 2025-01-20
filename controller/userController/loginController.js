const userSchema = require('../../model/userModel');
const sendPassword = require('../../utils/sendPassword');
const bcrypt = require('bcrypt');




const login = async (req, res) => {
	try {
		res.render('login');
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	}
};

const logincheck = async (req, res) => {
	try {
		const { username, password } = req.body;
		const userCheck = await userSchema.findOne({ username: username });

		if (userCheck === null) {
			console.log('User not Found!');
			return res
				.status(400)
				.json({ success: false, message: 'User not Found!' });
		}
		const is_password = await bcrypt.compare(password, userCheck.password);
		if (!is_password) {
			console.log('password not matching');
			return res
				.status(400)
				.json({ success: false, message: 'password not matching' });
		} else {
			req.session.user = userCheck;
			return res.status(200).json({ success: true });
		}
	} catch (error) {
		console.log(error);
	}
};








const userLogout = async (req, res) => {
	try {
		delete req.session.user;
		res.redirect('/');
	} catch (error) {
		console.log(error);
	}
};

const forgotpage = async (req, res) => {
	try {
		res.render('forgotpage');
	} catch (error) {
		console.log(error);
	}
};

const forgotpageCheck = async (req, res) => {
	try {
		console.log(req.body);
		const { email } = req.body;
		const Email = await userSchema.findOne({ email });

		if (Email === null) {
			console.log('Email not Exist!');
			return res
				.status(400)
				.json({ success: false, message: 'Email not Exist!' });
		} else {
			sendPassword(email);
			console.log(sendPassword);
			return res
				.status(200)
				.json({
					success: true,
					message: 'Password send to your email successfully....!',
				});
		}
	} catch (error) {
		console.log(error);
	}
};



module.exports = {
	login,
	logincheck,
	userLogout,
	forgotpage,
	forgotpageCheck,
};