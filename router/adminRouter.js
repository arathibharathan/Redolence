const express = require('express');
const adminRouter = express();
const upload = require('../middleware/multer');
const auth = require('../middleware/adminAuth');
const session = require('express-session');

const adminController = require('../controller/adminController/adminController');
const categoryController = require('../controller/adminController/categoryController');
const dashboardController = require('../controller/adminController/dashboardController');
const productController = require('../controller/adminController/productController');
const userController = require('../controller/adminController/userController');
const orderController = require('../controller/adminController/orderController')
const couponController = require('../controller/adminController/couponController')
const offerController = require('../controller/adminController/offerController')
const multer = require('../middleware/newMulter')

const { body, validationResult } = require('express-validator');


adminRouter.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);

//engine configaration
adminRouter.set('view engine', 'ejs'); //page setting
adminRouter.set('views', './views/admin'); //page setting

//loginAdmin
adminRouter.get('/login', auth.isLogout, adminController.getLoginPage);
adminRouter.post('/loginCheck', adminController.adminCheck);


//dashboard
adminRouter.get('/dashboard', auth.isLogin, dashboardController.getdashBoard);
adminRouter.get('/sales-report', auth.isLogin, dashboardController.getSalesReport);

//user
adminRouter.get('/userList', auth.isLogin, userController.getUserList);
adminRouter.post('/blockUser', userController.blockUser);
adminRouter.post('/unblockUser', userController.unblockUser);


// Category routes
adminRouter.get('/category', auth.isLogin, categoryController.renderCategoryPage);
adminRouter.post('/addCategory', auth.isLogin, categoryController.addCategory);
adminRouter.get('/category/:id', auth.isLogin, categoryController.getCategory);
adminRouter.put('/editCategory', auth.isLogin, categoryController.updateCategory);
adminRouter.put('/blockCategory', auth.isLogin, categoryController.blockCategory)



// product
adminRouter.get('/productList', auth.isLogin, productController.getProductList);
adminRouter.get('/addProduct', auth.isLogin, productController.getProductAdd);
adminRouter.post('/addProduct',upload.array('productImage', 3),productController.addProduct);
adminRouter.get('/editProduct', auth.isLogin, productController.editProduct);
adminRouter.post('/checkEditProduct', productController.checkEditProduct);
adminRouter.get('/blockProduct', auth.isLogin, productController.blockProduct);
adminRouter.post('/updateProduct',auth.isLogin, multer.updateImage, productController.updateProduct);
adminRouter.get('/searchProducts', productController.searchProducts)


//order
adminRouter.get('/orderList',auth.isLogin, orderController.orders)
adminRouter.get('/orderDetails/:id', auth.isLogin, orderController.orderDetails);
adminRouter.put('/updateOrderItem', auth.isLogin, orderController.updateOrderItem);

//coupon
// Get all coupons
adminRouter.get('/coupons', auth.isLogin, couponController.getCoupons);

// Create a new coupon
adminRouter.post('/coupons', auth.isLogin, couponController.createCoupon);

// Edit a coupon
adminRouter.post('/coupons/edit/:id', auth.isLogin, couponController.editCoupon);

// // Delete a coupon
adminRouter.delete('/coupons/:id', auth.isLogin, couponController.deleteCoupon);



// offers
adminRouter.get('/offers',auth.isLogin,offerController.loadOffer);
adminRouter.post('/offers/addOffers',offerController.addOffer)
adminRouter.get('/offers/category',offerController.loadCateOffer)
adminRouter.post('/updateOffer',offerController.updateOffer);
adminRouter.post('/deleteOffer',offerController.deleteOffer);




module.exports = adminRouter;
