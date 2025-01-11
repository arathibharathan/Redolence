const express = require('express')
const adminRouter = express()
const upload = require('../middleware/multer')
const auth = require('../middleware/adminAuth');
const session = require("express-session")


const adminController = require('../controller/adminController/adminController')
adminRouter.use(session({
    secret:  process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));


adminRouter.set('view engine', 'ejs'); //page setting
adminRouter.set('views', './views/admin'); //page setting

//login
adminRouter.get('/login', auth.isLogout, adminController.getLoginPage)
adminRouter.post('/loginCheck',adminController.adminCheck)

adminRouter.get('/dashboard', auth.isLogin,adminController.getdashBoard)


//user
adminRouter.get('/userList', auth.isLogin,adminController.getUserList)
adminRouter.post('/blockUser',adminController.blockUser)
adminRouter.post('/unblockUser',adminController.unblockUser)

// categoryRouter

adminRouter.get('/category', auth.isLogin,adminController.renderCategoryPage);
adminRouter.post('/createCategory',adminController.createCategory);
adminRouter.post('/category',adminController.categoryCheck)
adminRouter.get('/updateCategory',auth.isLogin,adminController.updateCategory);

adminRouter.get('/categories', auth.isLogin,adminController.getCatForEdit);

adminRouter.post('/editCategory', adminController.editCategory)

adminRouter.get('/blockCategory', auth.isLogin,adminController.blockCategory)



// product
adminRouter.get('/productList', auth.isLogin,adminController.getProductList)

adminRouter.get('/addProduct', auth.isLogin,adminController.getProductAdd)
adminRouter.post('/addProduct', upload.array('productImage', 3),adminController.addProduct)

adminRouter.get('/editProduct', auth.isLogin,adminController.editProduct)
adminRouter.post('/checkEditProduct',adminController.checkEditProduct)

adminRouter.get('/blockProduct', auth.isLogin,adminController.blockProduct)

module.exports = adminRouter