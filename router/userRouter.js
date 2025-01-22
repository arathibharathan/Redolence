const express = require("express");
const userRouter = express.Router(); 
const userController =require('../controller/userController/userController')
const shopController =require('../controller/userController/shopController')
const registerController =require('../controller/userController/registerController')
const profileController =require('../controller/userController/profileController')
const loginController =require('../controller/userController/loginController')
const checkoutController =require('../controller/userController/checkoutController')
const cartController =require('../controller/userController/cartController')
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

//home
userRouter.get('/', userController.home)


//login
userRouter.get("/login", auth.isLogout,loginController.login)
userRouter.post("/login", loginController.logincheck)


//register
userRouter.get("/register", auth.isLogout,registerController.register)
userRouter.post("/signup",registerController.registerCheck)


//otp
userRouter.get('/otp/:id',auth.isLogout,registerController.otpSender)
userRouter.post('/verifyOtp',registerController.verifyOTP)
userRouter.post('/resendOtp/:id',registerController.resendOtp)


//shop
userRouter.get('/shop', shopController.shop)
userRouter.get('/shop', shopController.getProducts)

userRouter.get('/product', shopController.product)



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


//forgotPassword
userRouter.get('/forgotPage',loginController.forgotpage)
userRouter.post('/forgotPage',loginController.forgotpageCheck)

//user
userRouter.get('/dashboard',auth.isLogin,profileController.userDetails)
userRouter.get('/editUser',auth.isLogin,profileController.editUser)
userRouter.post('/editUser', auth.isLogin,profileController.editUserdata)

//Address
userRouter.get('/address', auth.isLogin,profileController.address)
userRouter.post('/address', auth.isLogin, profileController.saveAddress);
userRouter.delete('/address/:addressId', auth.isLogin, profileController.deleteAddress)


//cart
userRouter.get('/cart', auth.isLogin,cartController.cart);
userRouter.post('/cart',auth.isLogin,cartController.addcart)
userRouter.post('/cart/update', auth.isLogin, cartController.updateCartQuantity);
userRouter.post('/cart/remove', auth.isLogin, cartController.removeProductFromCart);


//checkout
userRouter.get('/checkout',checkoutController.checkout)
userRouter.post('/save-address', checkoutController.addressSave);
userRouter.post('/place-order', checkoutController.placeOrder);

// Order
userRouter.get('/orders', checkoutController.orders);
userRouter.get('/orders', checkoutController.placeOrder);
userRouter.delete('/delete-address/:addressId', checkoutController.deleteAddress);

// Add these routes
userRouter.get('/get-address/:addressId', checkoutController.getAddressById);
userRouter.put('/update-address/:addressId', checkoutController.updateAddress);
   
// logout
userRouter.get('/logout',loginController.userLogout)


module.exports = userRouter 