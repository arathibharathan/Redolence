const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users',
	},
	address: [
		{
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
			},
			createdAt: {
				type: Date,
				default: Date.now,
			},
		},
	],
});

module.exports = mongoose.model('Address', addressSchema);
