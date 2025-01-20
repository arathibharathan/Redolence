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
        console.log(req.session.user._id);
        const findId = await addressSchema.findOne({
            userId: req.session.user._id,
        });

        if (!name || !streetAddress || !mobileNumber) {
            return res.status(400).json({ message: 'Required fields are missing' });
        } else if (name.length < 6 || name.length > 20) {
            console.log('Enter username length btw 6 to 20');
            return res
                .status(400)
                .json({ success: false, message: 'Enter username length btw 6 to 20' });
        } else if (mobileNumber.length !== 10) {
            console.log('mobile number must contains 10 digits');
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'mobile number must contains 10 digits',
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

                res.status(201).json({
                    message: 'Address saved successfully',
                    address: newAddress,
                });
            } else {
                const updatedAddress = await addressSchema.updateOne(
                    { userId: req.session.user._id }, // Match the document by userId
                    { $push: { address: address } } // Push the new address into the array
                );

                res.status(200).json({
                    message: 'Address added successfully to the existing user',
                    address: updatedAddress,
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error saving address' });
    }
};






module.exports = {
	userDetails,
	editUser,
	editUserdata,
	address,
	saveAddress
};