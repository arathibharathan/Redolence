const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users',
	},
	productDetails: [
		{
			productId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'products',
			},
			quantity: {
				type: Number,
				required: true,
				trim: true,
			},
		},
	],
	cartaddedAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('Cart', cartSchema);
