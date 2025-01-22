const userSchema = require('../../model/userModel');
const addressSchema = require('../../model/addressModel');
const bcrypt = require('bcrypt');



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
        const { name, phone, currentPassword, newPassword } = req.body;
        const userId = req.session.user._id;

        // Find the user
        const user = await userSchema.findById(userId);

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );
        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Update user details
        user.name = name;
        user.mobile = phone;

        // Update password if new password is provided
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

        const findId = await addressSchema.findOne({
            userId: req.session.user._id,
        });

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




const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        
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







module.exports = {
	userDetails,
	editUser,
	editUserdata,
	address,
	saveAddress,
    deleteAddress
};