const nodemailer = require('nodemailer');
const userSchema = require('../model/userModel');
const bcrypt = require('bcrypt');

const sendPassword = async (email) => {
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // Use true for port 465, false for all other ports
		auth: {
			user: 'arathiaarus997@gmail.com',
			pass: 'tnpq dikc kfpi iyah',
		},
	});
	const randomNumber = Math.floor(100000 + Math.random() * 900000);

	const info = await transporter.sendMail({
		from: 'arathiaarus997@gmail.com',
		to: email,
		subject: 'For forgot passoword in Redolance',
		text: '',
		html: `<b>Your PassWord is : ${randomNumber}</b>`,
	});

	console.log(randomNumber);
	const hashedNumber = await bcrypt.hash(randomNumber.toString(), 6); // Add the salt rounds
	await userSchema.updateOne(
		{ email: email }, // Find the document where email matches
		{ $set: { password: hashedNumber } } // Update the password field
	);
};

module.exports = sendPassword;
