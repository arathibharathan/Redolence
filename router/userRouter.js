const express = require("express");
// const path = require('path')
const userRouter = express.Router(); 
const userController =require('../controller/userController/userController')
const passport = require('../passport')
const session = require("express-session")


const auth = require('../middleware/userAuth');
const userCollection = require("../model/userModel");

userRouter.use(session({
    secret:  process.env.SESSION_SECRET,
    resave: false,
    rolling: false,
    saveUninitialized: true,

}));

//login
userRouter.get('/login', auth.isLogout,userController.login)
userRouter.post("/login",userController.logincheck)


//register
userRouter.get('/register', auth.isLogout,userController.register)
userRouter.post("/signup",userController.registerCheck)
userRouter.get('/', userController.home)

//otp
userRouter.get('/otp/:id',auth.isLogout,userController.otpSender)
userRouter.post('/verifyOtp',userController.verifyOTP)
userRouter.post('/resendOtp/:id',userController.resendOtp)



userRouter.get('/shop', userController.shop)
userRouter.get('/product', userController.product)


//googleAuthentication
userRouter.get('/auth/google', auth.isLogout, passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
}));


// Handle the callback
userRouter.get('/auth/google/callback', auth.isLogout, (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.user_id = user._id;
            return res.redirect('/');
        });
    })(req, res, next);
});


// logout
userRouter.get('/logout',userController.userLogout)

//forgotPassword
userRouter.get('/forgotPage',userController.forgotpage)
userRouter.post('/forgotPage',userController.forgotpageCheck)

// userRouter.get('/forgotPassword',userController.forgotpassword)

userRouter.get('/dashboard',auth.isLogin,userController.userDetails)
userRouter.get('/editUser',auth.isLogin,userController.editUser)
userRouter.post('/editUser', auth.isLogin,userController.editUserdata)

userRouter.get('/address', auth.isLogin,userController.address)
userRouter.post('/address', auth.isLogin, userController.saveAddress);


//cart
userRouter.get('/cart', auth.isLogin,userController.cart);
userRouter.post('/shop',auth.isLogin,userController.addcart)



module.exports = userRouter 