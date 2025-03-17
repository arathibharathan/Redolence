const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', // References the user who placed the order
        required: true,
    },
    order_id:{
        type:String
    },
    address: [{
			name: {
				type: String,
				required: true,
				trim: true,
			},
			mobile: {
				type: Number,
				required: true,
				trim: true,
			},
			streetAddress: {
				type: String,
				required: true,
				trim: true,
			},
			city: {
				type: String,
				required: true,
				trim: true,
			},
			landmark: {
				type: String,
				required: true,
				trim: true,
			},
			state: {
				type: String,
				required: true,
				trim: true,
			},
			pinCode: {
				type: Number,
				required: true,
			}
}],
    orderItems: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product', 
                required: true,
            },
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            totalPrice: {
                type: Number,
                required: true,
            },
            productStatus: {
                type: String,
                enum: ['Placed', 'Shipped', 'Delivered', 'Cancelled'],
                default: 'Placed',
            },
            cancellation_reason:{
                type:String
            },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'online','Online','Wallet'], 
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'], 
        default: 'Pending',
    },
    orderStatus: {
        type: String,
        enum: ['Placed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Placed',
    },
    orderedAt: {
        type: Date,
        default: Date.now, 
    },
    deliveredAt: {
        type: Date, 
    },
    couponOffer: {
        type: Number,
    }
});

module.exports = mongoose.model('Order', OrderSchema);