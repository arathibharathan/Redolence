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
				address: address // This is important for the client-side script
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

// const placeOrder = async (req, res) => {
//     try {

//         res.status(200).json({ 
//             success: true, 
//             message: 'Order placed successfully' 
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Error placing order' 
//         });
//     }
// };

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
        const selectedAddressDetails = addressDoc.address.find((x)=>x._id=addressId);

        // // Prepare order items
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



module.exports = {
	checkout,
	addressSave,
	placeOrder,
	orders
};