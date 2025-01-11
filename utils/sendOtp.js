const nodemailer = require("nodemailer");
const otpSchema = require('../model/otpModel')

const sendOtp = async(email)=>{
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // Use true for port 465, false for all other ports
        auth: {
          user: "arathiaarus997@gmail.com",
          pass: "tnpq dikc kfpi iyah",
        },
      });
      const randomgenerateOTP = Math.floor(100000 + Math.random() * 900000);

      const info = await transporter.sendMail({
        from: "arathiaarus997@gmail.com", 
        to: email, 
        subject: "For registration in Redolance",
        text: "", 
        html: `<b>Your OTP is : ${randomgenerateOTP}</b>`, 
      });

    console.log(randomgenerateOTP)
     await otpSchema.insertMany([{
        email: email,
        otp: randomgenerateOTP}])

}


module.exports = sendOtp



