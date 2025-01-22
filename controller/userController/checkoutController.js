const userSchema = require('../../model/userModel.js');
const addressSchema = require('../../model/addressModel');
const CartSchema = require('../../model/cartModel');
const ProductSchema = require('../../model/productModel');
const OrderSchema = require('../../model/orderModel.js');


const { v4: uuidv4 } = require('uuid');



const checkout = async (req, res) => {
    try {
        // If user is logged in, fetch their existing addresses
        const userId = req.session.user?._id; 
        const existingAddressDoc = userId 
            ? await addressSchema.findOne({ userId }) 
            : null;

        res.render('checkout', { 
            existingAddresses: existingAddressDoc ? existingAddressDoc.address : []
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};


// save Address with validation
const addressSave = async (req, res) => {
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

        // Validation
        if (!name || !streetAddress || !mobileNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Required fields are missing' 
            });
        }

        if (name.length < 6 || name.length > 20) {
            return res.status(400).json({ 
                success: false, 
                message: 'Enter username length between 6 to 20 characters' 
            });
        }

        if (mobileNumber.length !== 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mobile number must contain 10 digits' 
            });
        }

        const address = {
            name,
            mobile: mobileNumber,
            streetAddress,
            city,
            landmark,
            state,
            pinCode,
        };

        // Find or create address document
        let addressDoc = await addressSchema.findOne({ 
            userId: req.session.user._id 
        });

        if (!addressDoc) {
            // Create new address document
            addressDoc = new addressSchema({
                userId: req.session.user._id,
                address: [address]
            });
            await addressDoc.save();

            return res.status(201).json({
                success: true,
                message: 'Address saved successfully',
                address: address
            });
        } else {
            // Add new address to existing document
            addressDoc.address.push(address);
            await addressDoc.save();

			return res.status(201).json({
				success: true,
				message: 'Address saved successfully',
				address: address 
			});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving address' 
        });
    }
};

const orders = async (req, res) => {
    try {

        res.render('orders');
    } catch (error) {
        console.error(error);
    }
};
const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { addressId, paymentType } = req.body;

        

        // Fetch user's cart
        const cart = await CartSchema.findOne({ userId }).populate('productDetails.productId');
        
        if (!cart || cart.productDetails.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Fetch selected address
        const addressDoc = await addressSchema.findOne({ userId });
        const selectedAddressDetails = addressDoc.address.find((x) => x._id.equals(addressId));
        
 
        // Prepare order items
        const orderItems = cart.productDetails.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price,
            totalPrice: item.productId.price * item.quantity
        }));
        
        

        // Calculate total amount
        const totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0);

        // Create new order
        const newOrder = new OrderSchema({
            userId,
            order_id: `ORD-${uuidv4().substr(0, 8).toUpperCase()}`,
            address: [selectedAddressDetails],
            orderItems,
            totalAmount,
            paymentMethod: paymentType || 'COD',
            paymentStatus: 'Pending',
            orderStatus: 'Placed'
        });
        

        // Save the order
        await newOrder.save();

        // Clear the cart
        await CartSchema.findOneAndDelete({ userId });

        // Update product stock (optional)
        for (let item of orderItems) {
            await ProductSchema.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(200).json({ 
            message: 'Order placed successfully', 
            orderId: newOrder.order_id 
        });

    } catch (error) {
        console.error('Place Order Error:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
};


const deleteAddress =  async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.addressId;

        // Find the user's address document
        const addressDoc = await addressSchema.findOne({ userId });

        if (!addressDoc) {
            return res.status(404).json({ 
                success: false, 
                message: 'Address not found' 
            });
        }
        const getAddressById = async (req, res) => {
            try {
                const userId = req.session.user._id;
                const addressId = req.params.addressId;
        
                // Find the user's address document
                const addressDoc = await addressSchema.findOne({ userId });
        
                if (!addressDoc) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Address document not found' 
                    });
                }
        
                // Find the specific address
                const address = addressDoc.address.find(addr => 
                    addr._id.toString() === addressId
                );
        
                if (!address) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Address not found' 
                    });
                }
        
                res.status(200).json({ 
                    success: true, 
                    address 
                });
            } catch (error) {
                console.error('Get Address Error:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'Failed to retrieve address',
                    error: error.message 
                });
            }
        };
        
        const updateAddress = async (req, res) => {
            try {
                const userId = req.session.user._id;
                const addressId = req.params.addressId;
                const { 
                    name, 
                    mobile, 
                    streetAddress, 
                    city, 
                    landmark, 
                    state, 
                    pinCode 
                } = req.body;
        
                // Validation
                const validationErrors = [];
                if (!name) validationErrors.push('Name is required');
                if (!mobile) validationErrors.push('Mobile number is required');
                if (!streetAddress) validationErrors.push('Street address is required');
                if (!city) validationErrors.push('City is required');
                if (!landmark) validationErrors.push('Landmark is required');
                if (!state) validationErrors.push('State is required');
                if (!pinCode) validationErrors.push('PIN Code is required');
        
                if (validationErrors.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Validation Failed',
                        errors: validationErrors
                    });
                }
        
                // Find the user's address document
                const addressDoc = await addressSchema.findOne({ userId });
        
                if (!addressDoc) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Address document not found' 
                    });
                }
        
                // Find the index of the address to update
                const addressIndex = addressDoc.address.findIndex(addr => 
                    addr._id.toString() === addressId
                );
        
                if (addressIndex === -1) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Specific address not found' 
                    });
                }
        
                // Update the address
                const updatedAddress = {
                    _id: addressDoc.address[addressIndex]._id,
                    name,
                    mobile: Number(mobile),
                    streetAddress,
                    city,
                    landmark,
                    state,
                    pinCode: Number(pinCode),
                    createdAt: addressDoc.address[addressIndex].createdAt
                };
        
                addressDoc.address[addressIndex] = updatedAddress;
        
                // Save the updated document
                await addressDoc.save();
        
                res.status(200).json({ 
                    success: true, 
                    message: 'Address updated successfully',
                    updatedAddress
                });
        
            } catch (error) {
                console.error('Update Address Error:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'Failed to update address',
                    error: error.message 
                });
            }
        };


        

        // Remove the specific address from the address array
        addressDoc.address = addressDoc.address.filter(addr => 
            !addr._id.equals(addressId)
        );

        // Save the updated document
        await addressDoc.save();

        res.status(200).json({ 
            success: true, 
            message: 'Address deleted successfully' 
        });
    } catch (error) {
        console.error('Delete Address Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete address',
            error: error.message 
        });
    }
};

//Edit address controller

const getAddressById = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.addressId;

        // Find the user's address document
        const addressDoc = await addressSchema.findOne({ userId });

        if (!addressDoc) {
            return res.status(404).json({ 
                success: false, 
                message: 'Address document not found' 
            });
        }

        // Find the specific address
        const address = addressDoc.address.find(addr => 
            addr._id.toString() === addressId
        );

        if (!address) {
            return res.status(404).json({ 
                success: false, 
                message: 'Address not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            address 
        });
    } catch (error) {
        console.error('Get Address Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve address',
            error: error.message 
        });
    }
};

const updateAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.addressId;
        const { 
            name, 
            mobile, 
            streetAddress, 
            city, 
            landmark, 
            state, 
            pinCode 
        } = req.body;

        // Validation
        const validationErrors = [];
        if (!name) validationErrors.push('Name is required');
        if (!mobile) validationErrors.push('Mobile number is required');
        if (!streetAddress) validationErrors.push('Street address is required');
        if (!city) validationErrors.push('City is required');
        if (!landmark) validationErrors.push('Landmark is required');
        if (!state) validationErrors.push('State is required');
        if (!pinCode) validationErrors.push('PIN Code is required');

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation Failed',
                errors: validationErrors
            });
        }

        // Find the user's address document
        const addressDoc = await addressSchema.findOne({ userId });

        if (!addressDoc) {
            return res.status(404).json({ 
                success: false, 
                message: 'Address document not found' 
            });
        }

        // Find the index of the address to update
        const addressIndex = addressDoc.address.findIndex(addr => 
            addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Specific address not found' 
            });
        }

        // Update the address
        const updatedAddress = {
            _id: addressDoc.address[addressIndex]._id,
            name,
            mobile: Number(mobile),
            streetAddress,
            city,
            landmark,
            state,
            pinCode: Number(pinCode),
            createdAt: addressDoc.address[addressIndex].createdAt
        };

        addressDoc.address[addressIndex] = updatedAddress;

        // Save the updated document
        await addressDoc.save();

        res.status(200).json({ 
            success: true, 
            message: 'Address updated successfully',
            updatedAddress
        });

    } catch (error) {
        console.error('Update Address Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update address',
            error: error.message 
        });
    }
};





module.exports = {
	checkout,
	addressSave,
	placeOrder,
	orders,
    deleteAddress,
    getAddressById,
    updateAddress,
    
};