const userSchema = require('../../model/userModel');
const walletSchema = require('../../model/walletModel')
const otpSchema = require('../../model/otpModel');
const sendOtp = require('../../utils/sendOtp');
const bcrypt = require('bcrypt');
const hashPass = async (password) => {
    const hashed = await bcrypt.hash(password, 10);
    return hashed;
};

const register = async (req, res) => {
	try {
		res.render('register');
	} catch (error) {
		console.log(error);
	}
};
const registerCheck = async (req, res) => {
	try {
		const { name,
			  username,
			  email, 
			  mobile, 
			  password, 
			  confirmPassword } 
			  =req.body;

			  // To find the user,email,mobile exist in the db or not 
		let usercheck = await userSchema.findOne({ username: username });
		let emailcheck = await userSchema.findOne({ email: email });
		let mobilecheck = await userSchema.findOne({ mobile: mobile });
		
		if (usercheck) {
			console.log('username already exist');
			return res
				.status(400)
				.json({ success: false, message: 'user already exist ' });
		} else if (emailcheck) {
			console.log('email already exist');
			return res
				.status(400)
				.json({ success: false, message: 'Email already exist' });
		} else if (!/[A-Za-z0-9.%]+@gmail.com/.test(email)) {
			console.log('Enter valid email');
			return res
				.status(400)
				.json({ success: false, message: 'Enter valid email' });
		} else if (mobilecheck) {
			console.log('mobile number already exist');
			return res
				.status(400)
				.json({ success: false, message: 'mobile number already exist' });
		} else if (password !== confirmPassword) {
			console.log('confirm password is not matching');
			return res
				.status(400)
				.json({ success: false, message: 'confirm password is not matching' });
		} else if (mobile.length !== 10) {
			console.log('mobile number must contains 10 digits');
			return res
				.status(400)
				.json({
					success: false,
					message: 'mobile number must contains 10 digits',
				});
		} else if (username.length < 3 || username.length > 20) {
			console.log('Enter username length btw 3 to 20');
			return res
				.status(400)
				.json({ success: false, message: 'Enter username length btw 6 to 20' });

		} else if (name.length < 3 || name.length > 20) {
			console.log('Enter name length btw 3 to 20');
			return res
				.status(400)
				.json({ success: false, message: 'Enter name length btw 3 to 20' });

				// if the validation is success, send otp to the email
		} else {
			sendOtp(email);
			const hashPassword = await hashPass(password);
			//take all the values of the req.body in to the keys
			const user = {
				name: req.body.name,
				username: req.body.username,
				mobile: req.body.mobile,
				email: req.body.email,
				password: hashPassword,
			};
			// temporarly storing the user details in to the session for saving the user details to the db after otp confirmation
			req.session.tempUser = user;

			return res
				.status(200)
				.json({ success: true, message: 'signup successful!', email: email});
		}
	} catch (error) {
		console.log(error.message);
		res.status(500).send(error);
	}
};

// OTP
// the variable email is taking the email coming with otp from the otp.ejs page 
const otpSender = async (req, res) => {
	const email = req.params.id;
	res.render('otp', { email });
};

// Verify OTP
const verifyOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;

		const otpRecord = await otpSchema.findOne({ email });

		if (!req.session.tempUser) {
			return res
				.status(400)
				.json({
					success: false,
					message: 'session timedout please register again',
				});
		}

		// check the user is exist in the req.session.tempUser, else pass a error message 
		if (!otpRecord) {
			return res
				.status(400)
				.json({ success: false, message: 'OTP not found or expired' });
		}

		const newUser = req.session.tempUser;

		if (otpRecord.otp === otp) {
			console.log('otp matched', newUser);

			// await userSchema.insertMany([
			// 	{
			// 		name: newUser.name,
			// 		username: newUser.username,
			// 		email: newUser.email,
			// 		mobile: newUser.mobile,
			// 		password: newUser.password,
			// 	},
			// ]);

			const createdUser = await userSchema.create({
				name: newUser.name,
				username: newUser.username,
				email: newUser.email,
				mobile: newUser.mobile,
				password: newUser.password,
			});

			const newWallet = await walletSchema.create({
				userId: createdUser._id,
				balance: 0,
				transactions: [],
			});

			console.log(1,createdUser);
			console.log(2,newWallet);
			

			// Associate wallet with user
			createdUser.wallet = newWallet._id;
			await createdUser.save();


			req.session.tempUser = null;
			return res
				.status(200)
				.json({ success: true, message: 'OTP verified successfully' });
		} else {
			console.log('false');

			return res.status(400).json({ success: false, message: 'Invalid OTP' });
		}
	} catch (error) {
		console.log(error.message);
		res.status(500).send(error);
	}
};





































const resendOtp = async (req, res) => {
	try {
		const { email } = req.body;
		const deletePreviousOtp = await otpSchema.deleteOne({ email });

		sendOtp(email);
		return res
			.status(200)
			.json({ message: 'resend otp successfully sended....!' });
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	}
};


module.exports = {
	register,
	registerCheck,
	otpSender,
	verifyOTP,
	resendOtp,
};