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
        const { name, username, email, mobile, password, confirmPassword } = req.body;

        // Check for missing fields
        if (!name || !username || !email || !mobile || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required. Please fill in all details.",
            });
        }

        // Validate Name (Only letters, 3 to 20 characters)
        if (!/^[A-Za-z\s]{3,20}$/.test(name)) {
            return res.status(400).json({
                success: false,
                message: "Name should only contain letters and be between 3 to 20 characters.",
            });
        }

        // Validate Username (Only alphanumeric, 3 to 20 characters)
        if (!/^[A-Za-z0-9]{3,20}$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: "Username should be 3-20 characters long and contain only letters and numbers.",
            });
        }

        // Validate Email (Strict Gmail validation)
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Gmail address.",
            });
        }

        // Validate Mobile Number (Only numbers, exactly 10 digits)
        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: "Mobile number must be exactly 10 digits long.",
            });
        }

        // Validate Password (At least 6 characters long)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        // Confirm Password Match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match. Please check again.",
            });
        }

        // Check if username, email, or mobile number already exists in the database
        let usercheck = await userSchema.findOne({ username });
        let emailcheck = await userSchema.findOne({ email });
        let mobilecheck = await userSchema.findOne({ mobile });

        if (usercheck) {
            return res.status(400).json({
                success: false,
                message: "This username is already taken. Please choose another.",
            });
        }

        if (emailcheck) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        if (mobilecheck) {
            return res.status(400).json({
                success: false,
                message: "This mobile number is already registered.",
            });
        }

        // If all validations pass, proceed to send OTP
        sendOtp(email);
        const hashPassword = await hashPass(password);

        // Store user details in session for OTP verification
        req.session.tempUser = {
            name,
            username,
            mobile,
            email,
            password: hashPassword,
        };

        return res.status(200).json({
            success: true,
            message: "Signup successful! Please verify your email with the OTP sent.",
            email: email,
        });

    } catch (error) {
        console.error("Error in registration:", error.message);
        res.status(500).json({
            success: false,
            message: "An unexpected error occurred. Please try again later.",
        });
    }
};
// OTP
// the variable email is taking the email, it coming with otp from the otp.ejs page 
const otpSender = async (req, res) => {
	const email = req.params.id; //req.params.email
	res.render('otp', { email });
};

// Verify OTP
const verifyOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;

		// check the email is in the schema or not
		const otpRecord = await otpSchema.findOne({ email });
		console.log(1,otpRecord);
		
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

				await userSchema.create({
				name: newUser.name,
				username: newUser.username,
				email: newUser.email,
				mobile: newUser.mobile,
				password: newUser.password,
			});

			
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