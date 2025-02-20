const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    expireDate: {
        type: Date,
        required: true
    },
    maxPurchaseAmount: {
        type: Number,
        required: true
    },
    maxAmount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Coupon', couponSchema);