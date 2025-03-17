const mongoose = require('mongoose');
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

		// Check if username and password are provided
		if (!username || !password) {
			return res
				.status(400)
				.json({
					success: false,
					message: 'Username and password are required',
				});
		}

		// Validate username length (Optional: Add regex if needed)
		if (username.length < 3) {
			return res
				.status(400)
				.json({
					success: false,
					message: 'Username must be at least 3 characters long',
				});
		}

		// Check if user exists in the database
		const userCheck = await userSchema.findOne({ username: username });

		if (!userCheck) {
			console.log('User not found!');
			return res
				.status(404)
				.json({ success: false, message: 'Invalid username or password' });
		}

		// Compare entered password with hashed password in DB
		const isPasswordValid = await bcrypt.compare(password, userCheck.password);

		if (!isPasswordValid) {
			console.log('Incorrect password attempt');
			return res
				.status(401)
				.json({ success: false, message: 'Invalid username or password' });
		}

		// Store user session after successful login
		req.session.user = userCheck;

		return res.status(200).json({ success: true, message: 'Login successful' });
	} catch (error) {
		console.error('Login error:', error);
		return res
			.status(500)
			.json({
				success: false,
				message: 'Something went wrong. Please try again later.',
			});
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
		const { email } = req.body;
		//check email exist or not
		const Email = await userSchema.findOne({ email });

		if (Email === null) {
			console.log('Email not Exist!');
			return res
				.status(400)
				.json({ success: false, message: 'Email not Exist!' });
		} else {
			//send password to the mail
			sendPassword(email);
			console.log(sendPassword);
			return res.status(200).json({
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
	forgotpage,
	forgotpageCheck,
	userLogout,
};
