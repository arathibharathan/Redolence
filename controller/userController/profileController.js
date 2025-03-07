const userSchema = require('../../model/userModel');
const addressSchema = require('../../model/addressModel');
const bcrypt = require('bcrypt');
const mongoose = require("mongoose")

const userDetails = async (req, res) => {
    try {
        let user = await userSchema.findOne({ _id: req.session.user._id });
        res.render('userDetails', { user });
    } catch (error) {
        console.log(error);
    }
};

const editUser = async (req, res) => {
    try {
        let useredit = await userSchema.findOne({ _id: req.session.user._id });
        res.render('editUser', { useredit });
    } catch (error) {
        console.log(error);  
    }
};

const editUserdata = async (req, res) => {
    try {
        
        const { name, phone, currentPassword, newPassword, confirmPassword } = req.body; // Added confirmPassword
        console.log(req.body);

        const userId = req.session.user._id;
        const user = await userSchema.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: 'User  not found',
            });
        }

        if (name.length < 2) {
            return res.json({
                success: false,
                message: 'Name should have at least 2 characters'
            });
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.json({
                success: false,
                message: 'Please enter a valid 10-digit phone number'
            });
        }

        if (currentPassword.length < 6) {
            return res.json({
                success: false,
                message: 'Current password must be at least 6 characters long'
            });
        }

        if (newPassword.length < 6) { // Fixed logic
            return res.json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred',
        });
    }
};

const address = async (req, res) => {
    try {
        const userData = await addressSchema.findOne({
            userId: req.session.user._id,
        });

        const address = userData.address;

        res.render('address', { address });
    } catch (error) {
        console.log(error);
    }
};

const saveAddress = async (req, res) => {
    try {
        const {
            name,
            streetAddress,
            mobileNumber,
            city,
            landmark,
            state,
            pinCode,
        } = req.body;
        //find the user in the session
        const findId = await addressSchema.findOne({
            userId: req.session.user._id,
        });
        //validation
        if (!name || !streetAddress || !mobileNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Required fields are missing' 
            });
        } else if (name.length < 6 || name.length > 20) {
            return res.status(400).json({ 
                success: false, 
                message: 'Enter username length between 6 to 20' 
            });
        } else if (mobileNumber.length !== 10) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number must contain 10 digits',
            });
        } else {
            const address = {
                name,
                mobile: mobileNumber,
                streetAddress,
                city,
                landmark,
                state,
                pinCode,
            };

            // if the user have no address, insert the userId and address in the db
            if (!findId) {
                const newAddress = await addressSchema.insertMany([
                    { userId: req.session.user._id, address },
                ]);
                
                return res.status(201).json({
                    success: true,
                    message: 'Address saved successfully',
                    address: newAddress,
                });
            } else {
                //otherwise  update the address
                const updatedAddress = await addressSchema.findOneAndUpdate(
                    { userId: req.session.user._id },
                    { $push: { address: address } },
                    { new: true }
                );

                return res.status(200).json({
                    success: true,
                    message: 'Address added successfully',
                    address: [updatedAddress],
                });
            
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving address' 
        });
    }
};



//delete Address
const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        
        
        const userAddress = await addressSchema.findOne({
            userId: req.session.user._id
        });

        if (!userAddress) {
            return res.status(404).json({ 
                success: false, 
                message: 'User address not found' 
            });
        }

        // Remove the specific address
        const result = await addressSchema.findOneAndUpdate(
            { userId: req.session.user._id },
            { $pull: { address: { _id: addressId } } },
            { new: true }
        );

        if (result) {
            return res.status(200).json({ 
                success: true, 
                message: 'Address deleted successfully' 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Failed to delete address' 
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting address' 
        });
    }
};



const updateAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const {
            name,
            streetAddress,
            mobileNumber,
            city,
            landmark,
            state,
            pinCode,
        } = req.body;

        // Comprehensive validation
        const errors = [];

        // Name validation
        if (!name || name.length < 2 || name.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Name must be between 2 and 50 characters',
        })

        // Mobile number validation
        }else if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number must be 10 digits',
        })

        }else if (!streetAddress || streetAddress.length < 5 || streetAddress.length > 200) {
            return res.status(400).json({
                success: false,
                message:  'Street address must be between 5 and 200 characters',
        })
        }else if (!city || city.length < 2 || city.length > 50) {
            errors.push('City must be between 2 and 50 characters');
        }

        // Landmark validation
        if (!landmark || landmark.length < 2 || landmark.length > 100) {
            return res.status(400).json({
                success: false,
                message:  'Landmark must be between 2 and 100 characters',
        })
        }else if (!state || state.length < 2 || state.length > 50) {
            return res.status(400).json({
                success: false,
                message:  'State must be between 2 and 50 characters',
        })
    
        }else if (!pinCode || !/^\d{6}$/.test(pinCode)) {
            return res.status(400).json({
                success: false,
                message:  'Pin code must be 6 digits',
        })
        }else if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors
            });
        }

        // Find the user's address document
        const userAddress = await addressSchema.findOne({
            userId: req.session.user._id
        });

        if (!userAddress) {
            return res.status(404).json({
                success: false,
                message: 'User address not found'
            });
        }

        // Find the specific address to update
        const addressIndex = userAddress.address.findIndex(
            addr => addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Update the specific address
        userAddress.address[addressIndex] = {
            ...userAddress.address[addressIndex],
            name,
            mobile: parseInt(mobileNumber),
            streetAddress,
            city,
            landmark,
            state,
            pinCode: parseInt(pinCode)
        };

        // Save the updated document
        const updatedUserAddress = await userAddress.save();

        // Find the updated address
        const updatedAddress = updatedUserAddress.address[addressIndex];

        return res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            updatedAddress: updatedAddress
        });

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
    }
};




module.exports = {
	userDetails,
	editUser,
	editUserdata,
	address,
	saveAddress,
    deleteAddress,
    updateAddress
};