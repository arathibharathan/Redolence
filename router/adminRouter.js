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





module.exports = adminRouter;
