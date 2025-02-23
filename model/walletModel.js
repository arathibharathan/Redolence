const mongoose = require('mongoose');

// Define the Wallet Schema
const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
        unique: true // Each user can have only one wallet
    },
    balance: {
        type: Number,
        default: 0, // Default balance is 0
        min: 0 // Ensure balance doesn't go negative
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ['credit', 'debit'], // Type of transaction
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now // Automatically set the transaction date
            },
            walletBalance: { type: Number, default: 0 },
            walletTransactions: [{
            transactionId: String,
            date: String,
            description: String,
            amount: Number,
            type: String // 'Credit' or 'Debit'
         }]
        }
    ]
});

// Create the Wallet model
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;