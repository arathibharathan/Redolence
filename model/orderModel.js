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
                ref: 'product', // References the product in the order
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
                enum: ['Placed', 'Shipped', 'Delivered', 'Cancelled'], // Tracks the order status
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
        enum: ['COD'], // Cash on Delivery or Online Payment
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'], // Tracks the payment status
        default: 'Pending',
    },
    orderStatus: {
        type: String,
        enum: ['Placed', 'Shipped', 'Delivered', 'Cancelled'], // Tracks the order status
        default: 'Placed',
    },
    orderedAt: {
        type: Date,
        default: Date.now, // Time when the order was placed
    },
    deliveredAt: {
        type: Date, // Time when the order was delivered (optional)
    },
});

module.exports = mongoose.model('PlaceOrder', OrderSchema);