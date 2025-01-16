const userSchema = require('../../model/userModel');
const otpSchema = require('../../model/otpModel');
const productSchema = require('../../model/product');
const addressSchema = require('../../model/addressModel');
const cartSchema = require('../../model/cartModel');

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const sendOtp = require('../../utils/sendOtp');
const sendPassword = require('../../utils/sendPassword');

const otpModel = require('../../model/otpModel');
const { log } = require('console');
const passport = require('../../passport');

const bcrypt = require('bcrypt');
const { trusted } = require('mongoose');
const hashPass = async (password) => {
	const hashed = await bcrypt.hash(password, 10);
	console.log('P++++++++++++++++assword bcrypted');
	return hashed;
};

const login = async (req, res) => {
	try {
		res.render('login');
	} catch (error) {
		console.log(error);
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

const register = async (req, res) => {
	try {
		res.render('register');
	} catch (error) {
		console.log(error);
	}
};

const registerCheck = async (req, res) => {
	try {
		const { name, username, email, mobile, password, confirmPassword } =
			req.body;
		let emailcheck = await userSchema.findOne({ email: email });
		let usercheck = await userSchema.findOne({ username: username });
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
		} else if (username.length < 6 || username.length > 20) {
			console.log('Enter username length btw 6 to 20');
			return res
				.status(400)
				.json({ success: false, message: 'Enter username length btw 6 to 20' });
		} else if (name.length < 3 || name.length > 20) {
			console.log('Enter name length btw 3 to 20');
			return res
				.status(400)
				.json({ success: false, message: 'Enter name length btw 3 to 20' });
		} else {
			sendOtp(email);
			const hashPassword = await hashPass(password);
			req.body.password = hashPassword;
			const user = {
				name: req.body.name,
				username: req.body.username,
				mobile: req.body.mobile,
				email: req.body.email,
				password: hashPassword,
			};

			req.session.tempUser = user;

			return res
				.status(200)
				.json({ success: true, message: 'signup successful!', email: email });
		}
	} catch (error) {
		console.log(error.message);
		res.status(500).send(error);
	}
};

const home = async (req, res) => {
	try {
		if (req.session.user) {
			let User = await userSchema.find({ _id: req.session.user._id });
			res.render('home', { User });
		} else {
			let User = undefined;
			res.render('home', { User });
		}
	} catch (error) {
		console.log(error);
	}
};

// OTP
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

		if (!otpRecord) {
			return res
				.status(400)
				.json({ success: false, message: 'OTP not found or expired' });
		}

		const newUser = req.session.tempUser;

		if (otpRecord.otp === otp) {
			console.log('otp matched', newUser);

			await userSchema.insertMany([
				{
					name: newUser.name,
					username: newUser.username,
					email: newUser.email,
					mobile: newUser.mobile,
					password: newUser.password,
				},
			]);
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

const shop = async (req, res) => {
	try {
		const products = await productSchema.find({});
		res.render('shop', { products });
	} catch (error) {
		console.log(error);
	}
};

const product = async (req, res) => {
	try {
		const product = await productSchema.findOne({ _id: req.query.id });
		res.render('product', { product });
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

// const forgotpassword = async (req,res) =>{
// 	try {
// 		res.render('forgotPassword')
// 	} catch (error) {
// 		console.log(error);
// 	}
// }

const userDetails = async (req, res) => {
	try {
		let user = await userSchema.findOne({ _id: req.session.user._id });
		res.render('userDetails', { user });
	} catch (error) {
		console.log(error);
	}
};

const editUser = async (req, res) => {
	try {
		let useredit = await userSchema.findOne({ _id: req.session.user._id });
		res.render('editUser', { useredit });
	} catch (error) {
		console.log(error);
	}
};

const editUserdata = async (req, res) => {
	try {
		const { name, phone, currentPassword, newPassword } = req.body;
		const userId = req.session.user._id;

		// Find the user
		const user = await userSchema.findById(userId);

		// Verify current password
		const isPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password
		);
		if (!isPasswordValid) {
			return res.json({
				success: false,
				message: 'Current password is incorrect',
			});
		}

		// Update user details
		user.name = name;
		user.mobile = phone;

		// Update password if new password is provided
		if (newPassword) {
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			user.password = hashedPassword;
		}

		await user.save();

		res.json({
			success: true,
			message: 'Profile updated successfully',
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: 'Server error occurred',
		});
	}
};

const address = async (req, res) => {
	try {
		const userData = await addressSchema.findOne({
			userId: req.session.user._id,
		});

		const address = userData.address;

		res.render('address', { address });
	} catch (error) {
		console.log(error);
	}
};

const saveAddress = async (req, res) => {
	try {
		const {
			name,
			streetAddress,
			mobileNumber,
			city,
			landmark,
			state,
			pinCode,
		} = req.body;
		console.log(req.session.user._id);
		const findId = await addressSchema.findOne({
			userId: req.session.user._id,
		});

		if (!name || !streetAddress || !mobileNumber) {
			return res.status(400).json({ message: 'Required fields are missing' });
		} else if (name.length < 6 || name.length > 20) {
			console.log('Enter username length btw 6 to 20');
			return res
				.status(400)
				.json({ success: false, message: 'Enter username length btw 6 to 20' });
		} else if (mobileNumber.length !== 10) {
			console.log('mobile number must contains 10 digits');
			return res
				.status(400)
				.json({
					success: false,
					message: 'mobile number must contains 10 digits',
				});
		} else {
			const address = {
				name,
				mobile: mobileNumber,
				streetAddress,
				city,
				landmark,
				state,
				pinCode,
			};
			if (!findId) {
				const newAddress = await addressSchema.insertMany([
					{ userId: req.session.user._id, address },
				]);

				res.status(201).json({
					message: 'Address saved successfully',
					address: newAddress,
				});
			} else {
				const updatedAddress = await addressSchema.updateOne(
					{ userId: req.session.user._id }, // Match the document by userId
					{ $push: { address: address } } // Push the new address into the array
				);

				res.status(200).json({
					message: 'Address added successfully to the existing user',
					address: updatedAddress,
				});
			}
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Error saving address' });
	}
};


// calculate the subtotal in this controller
const cart = async (req, res) => {
	try {
	  const userData = await cartSchema.findOne({ userId: req.session.user._id });
  
	  const productDetails = userData.productDetails.map(item => ({
		productId: item.productId.toString(),
		quantity: item.quantity,
	  }));
  
	  const productIds = productDetails.map(item => item.productId);
  
	  const products = await productSchema.find({ _id: { $in: productIds } });
  
	  // Combine the product details with the quantity
	  const enrichedProducts = products.map(product => {
		const matchedDetail = productDetails.find(
		  detail => detail.productId === product._id.toString()
		);
		return {
		  ...product._doc, // Include all fields of the product
		  quantity: matchedDetail ? matchedDetail.quantity : 0,
		};
	  });
  
	  // Calculate subtotal
	  const subtotal = enrichedProducts.reduce((total, product) => {
		return total + (product.price || 0) * product.quantity;
	  }, 0);
  
	  res.render('cart', { products: enrichedProducts, subtotal });
	} catch (error) {
	  console.error(error);
	}
  };
const addcart = async (req, res) => {
	try {
		const productId = req.body.productId;
		const userId = req.session.user._id;

		const product = await productSchema.findById(productId);

		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		let cart = await cartSchema.findOne({ userId: userId });

		if (!cart) {
			
			cart = new cartSchema({
				userId: userId,
				productDetails: [],
			});
		}

		const existingProductIndex = cart.productDetails.findIndex(
			(item) => item.productId.toString() === productId
		);

		if (existingProductIndex > -1) {
		
			cart.productDetails[existingProductIndex].quantity += 1;
		} else {
			
			cart.productDetails.push({
				productId: productId,
				quantity: 1,
			});
		}

		await cart.save();

		res.status(200).json({
			message: 'Product added to cart',
			cart: cart,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Error adding product to cart' });
	}
};

const updateCartQuantity = async (req, res) => {
	try {
	  const { productId, quantity } = req.body;
  
	  if (!productId || !quantity) {
		return res.status(400).json({ success: false, message: 'Invalid input' });
	  }
  
	  // Update the quantity in the database
	  await cartSchema.updateOne(
		{ userId: req.session.user._id, 'productDetails.productId': productId },
		{ $set: { 'productDetails.$.quantity': quantity } }
	  );
  
	  res.json({ success: true, message: 'Quantity updated successfully' });
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ success: false, message: 'Internal server error' });
	}
  };


  const removeProductFromCart = async (req, res) => {
	try {
	  const { productId } = req.body;
  
	  if (!productId) {
		return res.status(400).json({ success: false, message: 'Product ID is required' });
	  }
  
	  // Remove the product from the cart
	  await cartSchema.updateOne(
		{ userId: req.session.user._id },
		{ $pull: { productDetails: { productId } } }
	  );
  
	  res.json({ success: true, message: 'Product removed successfully' });
	} catch (error) {
	  console.error(error);
	  res.status(500).json({ success: false, message: 'Internal server error' });
	}
  };

const checkout = async (req, res) => {
    try {
        // If user is logged in, fetch their existing addresses
        const userId = req.session.userId; // Assuming you have user session
        const existingAddresses = userId 
            ? await addressSchema.findOne({ userId }) 
            : null;

        res.render('checkout', { 
            existingAddresses: existingAddresses ? existingAddresses.address : []
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

const addressSave = async (req, res) => {
    try {
		
        const { 
            name, 
            mobile, 
            streetAddress, 
            city, 
            landmark, 
            state, 
            pinCode 
        } = req.body;

        

		if (!name || name.trim().length < 2) {
			console.log('Name must be at least 2 characters long');
			return res
				.status(400)
				.json({ success: false, message: 'Name must be at least 2 characters long' });
		} else if (!mobile || !/^\d{10}$/.test(mobile)) {
			console.log('Mobile number must be 10 digits')
			return res
				.status(400)
				.json({ success: false, message: 'Mobile number must be 10 digits' });
		} else if (!streetAddress || streetAddress.trim().length < 5) {
			console.log('Street address must be at least 5 characters long');
			return res
				.status(400)
				.json({ success: false, message: 'Street address must be at least 5 characters long' });
		} else if (!city || city.trim().length < 2) {
			console.log('City must be at least 2 characters long');
			return res
				.status(400)
				.json({ success: false, message: 'City must be at least 2 characters long' });
		} else if (!landmark || landmark.trim().length < 2) {
			console.log('Landmark must be at least 2 characters long');
			return res
				.status(400)
				.json({ success: false, message: 'Landmark must be at least 2 characters long' });
		} else if (!state || state.trim().length < 2) {
			console.log('State must be at least 2 characters long');
			return res
				.status(400)
				.json({
					success: false,
					message: 'State must be at least 2 characters long',
				});
		} else if (!pinCode || !/^\d{6}$/.test(pinCode)) {
			console.log('PIN code must be 6 digits');
			return res
				.status(400)
				.json({ success: false, message: 'PIN code must be 6 digits'});
		}
		// Save to database
		const newAddress = new Schema({
			name: name.trim(),
			mobile,
			streetAddress: streetAddress.trim(),
			city: city.trim(),
			landmark: landmark.trim(),
			state: state.trim(),
			pinCode,
		});

		await newAddress.save();

		return res.status(201).json({
			success: true,
			message: 'Address saved successfully',
			address: newAddress,
		});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while saving address' });
	}
};




  

module.exports = {
	login,
	register,
	registerCheck,
	logincheck,
	home,
	otpSender,
	verifyOTP,
	resendOtp,
	shop,
	product,
	userLogout,
	forgotpage,
	forgotpageCheck,
	userDetails,
	editUser,
	editUserdata,
	address,
	saveAddress,
	cart,
	addcart,
	updateCartQuantity,
	removeProductFromCart,
	checkout,
	addressSave
};
