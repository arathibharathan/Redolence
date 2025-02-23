const userSchema = require('../../model/userModel.js');
const addressSchema = require('../../model/addressModel');
const CartSchema = require('../../model/cartModel');
const ProductSchema = require('../../model/productModel');
const OrderSchema = require('../../model/orderModel.js');


const { v4: uuidv4 } = require('uuid');
const { RazorCreateOrder, razorMatchPayment, razorRefundPayment } = require('../../razorPay/razorPay.js');



const checkout = async (req, res) => {
    try {
        const userId = req.session.user?._id;
        
       
        const existingAddressDoc = userId 
            ? await addressSchema.findOne({ userId }) 
            : null;

       
        const cart = await CartSchema.findOne({ userId })
            .populate('productDetails.productId');

        if (!cart) {
            return res.redirect('/cart');
        }

        cart.productDetails = cart.productDetails.filter(item => item.productId !== null);

        if (cart.productDetails.length === 0) {
            return res.redirect('/cart');
        }

        res.render('checkout', { 
            existingAddresses: existingAddressDoc ? existingAddressDoc.address : [],
            cart: cart
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

        
        let addressDoc = await addressSchema.findOne({ 
            userId: req.session.user._id 
        });

        if (!addressDoc) {
            
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
        if (!req.session.user) {
            return res.redirect('/login');
        }
        const userOrders = await OrderSchema.find({ 
            userId: req.session.user._id 
        }).sort({ orderedAt: -1 });

        res.render('orders', { 
            orders: userOrders,
            user: req.session.user 
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error fetching orders' });
    }
};


// const placeOrder = async (req,res) =>{
//     try {
//         const userId = req.session.user._id
//         const { addressId, paymentMethod } =req.body

//         // ---- Find the cart
//         const cart = await CartSchema.findOne({ userId })

//         if (!cart || cart.productDetails.length === 0) {
//             return res.status(400).json({ error: 'Cart is empty' });
//         }

//         // -- User ordered Products
//         const orderedProducts = cart.productDetails

//         // --- Get the excat address
//         const addressDoc = await addressSchema.findOne({ userId });
//         const selectedAddressDetails = addressDoc.address.find(
//             (x) => x._id.toString() === addressId
//         );




        
//     } catch (error) {
//         console.log(error);
        
//     }
// }


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { addressId, paymentMethod } = req.body;
        console.log(paymentMethod,'**************************')
        const cart = await CartSchema.findOne({ userId }).populate('productDetails.productId');

        if (!cart || cart.productDetails.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const validCartItems = cart.productDetails.filter(item => item.productId != null);

        if (validCartItems.length === 0) {
            return res.status(400).json({ 
                error: 'No valid products in cart. Some products may have been removed from the store.' 
            });
        }

        if (validCartItems.length !== cart.productDetails.length) {
             
            await CartSchema.findOneAndUpdate(
                { userId },
                { $set: { productDetails: validCartItems } }
            );
        }

        // Fetch selected address
        const addressDoc = await addressSchema.findOne({ userId });
        if (!addressDoc || !addressDoc.address) {
            return res.status(400).json({ error: 'No valid shipping address found' });
        }

        const selectedAddressDetails = addressDoc.address.find(
            (x) => x._id.toString() === addressId
        );

        if (!selectedAddressDetails) {
            return res.status(400).json({ error: 'Selected address not found' });
        }

        // Prepare order items with additional validation
        const orderItems = validCartItems.map(item => {
            // Additional validation for required fields
            if (!item.productId.price || !item.quantity) {
                throw new Error(`Invalid product data for ${item.productId.name || 'unknown product'}`);
            }

            return {
                productId: item.productId._id,
                name: item.productId.name,
                quantity: item.quantity,
                price: item.productId.price,
                totalPrice: item.productId.price * item.quantity
            };
        });

        // Calculate total amount
        const totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0);

        // Create new order
        const newOrder = new OrderSchema({
            userId,
            order_id: `ORD-${uuidv4().substr(0, 8).toUpperCase()}`,
            address: [selectedAddressDetails],
            orderItems,
            totalAmount,
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: 'Pending',
            orderStatus: 'Placed'
        });

        // Save the order
        const result = await newOrder.save();
        let paymentID = ''
        if(paymentMethod == 'online'){
            console.log(paymentMethod,'***************<>>>>>>>>>>>>>>>>>>>')
            paymentID  =await  RazorCreateOrder(result.totalAmount,result?.order_id) 
        }
          
        console.log(paymentID);
        
        
        
        // Clear the cart
        await CartSchema.findOneAndDelete({ userId });

        // Update product stock with validation
        for (const item of orderItems) {
            const product = await ProductSchema.findById(item.productId);
            if (product) {
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${item.name}`);
                }
                product.stock -= item.quantity;
                await product.save();
            }
        }

        res.status(200).json({
            message: 'Order placed successfully',
            orderId: newOrder.order_id,
            id: newOrder._id,
            amount:newOrder?.totalAmount,
            paymentId:paymentID
        });

    } catch (error) {
        console.error('Place Order Error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to place order',
            details: 'Please try again or contact support if the problem persists'
        });
    }
};

const confirmPayment =async  (req,res)=>{
    try {

        const data = req.body 
        console.log(data,'implement pyment logic here ')

        /*
        api call when success full payment done , take payment referance from req.body , verify with razorpay server ,
        if payment sucess full , update the details in the order payment ,
        responcd with sucessfull payment details 
        */

        const payment = await razorMatchPayment(req.body.razorpay_payment_id);
        console.log(data,'paymentDetails')
        res.json(req.body)

    } catch (error) {
        
    }
}

const cancelBooking = (req,res)=>{
    try {
        /* 
        api will call when a payment  fails , take the details from input , cancel the order 
        */
        const data = req.body 
        console.log(data,'paymentDetails')
        res.json(req.body)

    } catch (error) {
        
    }
}


const cancelOrderandrefundPayment  = async (req,res)=>{
    try {
        /* 
        api will call when a order cancelled by the user , give the payment refereacne from input to the below razorpay api , 

        which cancell the payment and return the object , once cancelation is done , cancel the order 

        */
        const data = req.body 
        const  refund = await razorRefundPayment(paymentId.receiptNumber) 
        console.log(data,'paymentDetails')
        res.json(req.body)

    } catch (error) {
        
    }
}


// apply and remove coupon
const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user?._id;

        // Validate the coupon code (you can implement your own logic here)
        const coupon = await CouponSchema.findOne({ code: couponCode, isActive: true });
        if (!coupon) {
            return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
        }

        // Assuming you have a way to store the applied coupon in the session or database
        req.session.appliedCoupon = coupon;

        return res.json({ success: true, discount: coupon.discount });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const removeCoupon = (req, res) => {
    try {
        delete req.session.appliedCoupon; 
        return res.json({ success: true, message: 'Coupon removed successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};




const getOrderDetails = async (req, res) => {
    try {
        const order = await OrderSchema.findById(req.params.orderId)
            .populate('orderItems.productId');
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Ensure the order belongs to the logged-in user
        if (order.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body; // Expecting orderId and new status in the request body

        // Validate the status
        const validStatuses = ['Placed', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Find the order and update the status
        const order = await OrderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update the order status
        order.orderStatus = status;
        await order.save();

        res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};


const cancelOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body; // Get the reason from the request body

        const order = await OrderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if the order can be cancelled
        if (order.orderStatus !== 'Placed' && order.orderStatus !== 'Pending') {
            return res.status(400).json({ error: 'Order cannot be cancelled' });
        }

        // Calculate the total amount to be refunded
        const totalAmount = order.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);

        // Increase the stock for each product in the order
        for (const item of order.orderItems) {
            const product = await ProductSchema.findById(item.productId);
            if (product) {
                product.stock += item.quantity; // Increase stock by the quantity of the cancelled order
                await product.save(); // Save the updated product
            }
        }

        // Update the order status to 'Cancelled' and add the reason
        order.orderStatus = 'Cancelled';
        order.cancellationReason = reason; // Store the cancellation reason
        const orderState = await order.save();

        // Update the wallet balance and add a transaction record
        const wallet = await Wallet.findOne({ userId: order.userId });
        if (wallet) {
            wallet.balance += totalAmount;
            wallet.transactions.push({
                type: 'credit',
                amount: totalAmount,
                description: 'Refund for cancelled order',
                date: new Date(),
                walletBalance: wallet.balance
            });
            await wallet.save();
        }

        res.status(200).json({ message: 'Order cancelled successfully', orderState });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};

const requestReturn = async (req, res) => {
    try {
        const { orderId, reason } = req.body; // Get the orderId and reason from the request body

        const order = await OrderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if the order can be returned
        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({ error: 'Return only available for delivered orders' });
        }

        order.returnRequest = {
            requested: true,
            reason: reason,
            status: 'Pending'
        };
        
        await order.save();
        res.json({ message: 'Return request submitted successfully' });
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ error: 'Failed to process return request' });
    }
};

const placeOrderInvoice = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        const userOrders = await OrderSchema.findById(req.params.id)
        console.log(userOrders);
        

        res.render('placeOrderInvoice', { 
            orders: userOrders,
            user: req.session.user 
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error fetching orders' });
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
        const address = addressDoc.addressSchema.find(addr => 
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
    confirmPayment,
	placeOrder,
	orders,
    getOrderDetails,
    updateOrderStatus,
    cancelOrder,
    requestReturn,
    placeOrderInvoice,
    deleteAddress,
    getAddressById,
    updateAddress,
    applyCoupon,
    removeCoupon,
    cancelBooking,
    cancelOrderandrefundPayment
    
};