const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
	stock: {
		type: Number,
		default: 0,
	},
	images: {
		type: Array,
	},
	is_list: {
		type: Boolean,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model('product', productSchema);
