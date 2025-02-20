const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerTitle: {
        type: String,
        required: true,
        trim: true
    },
    offerType:{
        type:String,
        requiered:true,
        enum:['product','category']
    },

    offerDescription: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'], // Percentage or Flat Discount
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    minPurchaseAmount: {
        type: Number,
        default: 0 // Minimum cart amount required to apply the offer
    },
    applicableProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products', // If offer is for a specific product
        ref: 'Category',
        required: true // Ensure this is required if applicable
    },
    startDate: {
        type: Date,
        required: true
    },
    expireDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'upcoming'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Automatically update offer status based on expiration date
offerSchema.pre('save', function (next) {
    const currentDate = new Date();
    if (this.expireDate < currentDate) {
        this.status = 'expired';
    } else if (this.startDate > currentDate) {
        this.status = 'upcoming';
    } else {
        this.status = 'active';
    }
    next();
});

module.exports = mongoose.model('Offer', offerSchema);