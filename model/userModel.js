const mongoose = require('mongoose');

// Define the schema for the User model
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        username: {
            type: String,
            required: true
        },
        email: { 
            type: String,
            required: true,
            unique: true 
        },
        mobile: { 
            type: Number,
              
        },
        password: {
            type: String,

        },
        is_block:{
            type: Boolean,
            required:true,
            default: false

        },
        is_admin:{
            type: Boolean,
            required: true,
            default: false

        },
        createdDate:{
            type: Date,
            default:Date.now, 
            required: true
        },
        
    },{timestamps:true}
);

// Create the User model from the schema
const userCollection = mongoose.model('User', userSchema);

module.exports = userCollection;



