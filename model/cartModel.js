const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  productDetails: [
    {
      image: {
        type: String,
        required: true,
        trim: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      price: {
        type: String,
        required: true,
        trim: true,
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
