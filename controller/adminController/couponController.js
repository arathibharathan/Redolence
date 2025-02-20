const couponSchema = require('../../model/couponModel')
const productSchema = require('../../model/productModel')
const offerSchema = require('../../model/offerModel')
const CategorySchema = require('../../model/categoryModel')
const { body, validationResult } = require('express-validator');


const getCoupons = async (req, res) => {
    try {
        const coupons = await couponSchema.find();
        res.render('coupon', { coupons }); // Ensure you are passing 'coupons'
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}; 

const createCoupon = async (req, res) => {
    try {
        const { code, description, discount, status, expireDate, maxPurchaseAmount, maxAmount } = req.body;
        
        
        const newCoupon = new couponSchema({ code, description, discount, status, expireDate, maxPurchaseAmount, maxAmount });
        await newCoupon.save();
        res.redirect('/admin/coupons'); // Redirect to the coupon list
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

// const updateCoupon = async (req, res) => {
//     try {
//         const { code, description, discount, status, expireDate, maxPurchaseAmount, maxAmount } = req.body;
//         const updatedCoupon = await couponSchema.findByIdAndUpdate(req.params.id, {
//             code,
//             description,
//             discount,
//             status: status === 'true', // Convert string to boolean
//             expireDate,
//             maxPurchaseAmount,
//             maxAmount
//         }, { new: true });

//         // Redirect to the coupon list or send a success response
//         res.redirect('/admin/coupons'); // Adjust this path as necessary
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: 'Internal Server Error', message: error.message });
//     }
// };

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await couponSchema.findByIdAndDelete(id);
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};





module.exports = {
     getCoupons,
     createCoupon,
    //  updateCoupon,
     deleteCoupon
}