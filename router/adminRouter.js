const express = require('express');
const adminRouter = express();
const upload = require('../middleware/multer');
const auth = require('../middleware/adminAuth');
const session = require('express-session');
const offerSchema = require('../model/offerModel')
const productSchema = require('../model/productModel')

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

//user
adminRouter.get('/userList', auth.isLogin, userController.getUserList);
adminRouter.post('/blockUser', userController.blockUser);
adminRouter.post('/unblockUser', userController.unblockUser);


// categoryRouter
adminRouter.get('/category', auth.isLogin, categoryController.renderCategoryPage);
adminRouter.post('/createCategory', categoryController.createCategory);
adminRouter.post('/category', categoryController.categoryCheck);
adminRouter.get('/updateCategory',auth.isLogin,categoryController.updateCategory);
adminRouter.get('/categories', auth.isLogin, categoryController.getCatForEdit);
adminRouter.post('/editCategory', categoryController.editCategory);
adminRouter.get('/blockCategory', auth.isLogin, categoryController.blockCategory);



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
adminRouter.get('/salesReport', auth.isLogin, orderController.salesReport);
adminRouter.get('/download-excel', auth.isLogin, orderController.downloadExcel);

//coupon
// Get all coupons
adminRouter.get('/coupons', auth.isLogin, couponController.getCoupons);

// Create a new coupon
adminRouter.post('/coupons', auth.isLogin, couponController.createCoupon);

// // Update a coupon
// adminRouter.put('/coupons/:id', auth.isLogin, couponController.updateCoupon);

// // Delete a coupon
adminRouter.delete('/coupons/:id', auth.isLogin, couponController.deleteCoupon);

//product Offer
adminRouter.get('/productOffers', auth.isLogin, offerController.productOffers);
adminRouter.get('/api/products', auth.isLogin, offerController.getProducts);
adminRouter.post('/api/offers', auth.isLogin, offerController.createOffer);
adminRouter.delete('/api/offers/:id', auth.isLogin, offerController.deleteOffer);
adminRouter.get('/api/product-offers', auth.isLogin, offerController.offers)

// Category offer
adminRouter.get('/api/categories', auth.isLogin, offerController.getCategories);
adminRouter.get('/categoryOffers', auth.isLogin, offerController.categoryOffers);
adminRouter.get('/api/categoryOffers', auth.isLogin, offerController.getCategoryOffers);
adminRouter.post('/api/categoryOffers', auth.isLogin, offerController.createCategoryOffer);
adminRouter.get('/api/categoryOffers/:id', auth.isLogin, offerController.getCategoryOfferById);
adminRouter.put('/api/categoryOffers/:id', auth.isLogin, offerController.updateCategoryOffer);
adminRouter.delete('/api/categoryOffers/:id', auth.isLogin, offerController.deleteCategoryOffer);

adminRouter.get('/referralOffers', auth.isLogin, offerController.referralOffers)




module.exports = adminRouter;
