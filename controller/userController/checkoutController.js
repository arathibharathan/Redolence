const userSchema = require('../../model/userModel.js');
const addressSchema = require('../../model/addressModel');
const CartSchema = require('../../model/cartModel');
const ProductSchema = require('../../model/productModel');
const OrderSchema = require('../../model/orderModel.js');
const walletSchema = require('../../model/walletModel.js');
const CouponSchema = require('../../model/couponModel.js')


const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


const cancelRazorpay = async(req, res) => {
	try {
		
		await OrderSchema.updateOne({ _id: req.query.id }, { paymentStatus: 'Failed' })
		
		res.redirect(`/`)
	} catch (error) {
		
	}
}


const checkout = async (req, res) => {
	try {
		
		const userId = req.session.user?._id;

		const existingAddressDoc = userId
			? await addressSchema.findOne({ userId })
			: null;

		const cart = await CartSchema.findOne({ userId }).populate(
			'productDetails.productId'
		);
		const wallet = await walletSchema.find({})
		// console.log("36537",wallet.balance);
		

		if (!cart) {
			return res.redirect('/cart');
		}

		cart.productDetails = cart.productDetails.filter(
			(item) => item.productId !== null
		);

		if (cart.productDetails.length === 0) {
			return res.redirect('/cart');
		}

		res.render('checkout', {
			wallet,
			existingAddresses: existingAddressDoc ? existingAddressDoc.address : [],
			cart: cart,
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
				message: 'Required fields are missing',
			});
		}

		if (name.length < 6 || name.length > 20) {
			return res.status(400).json({
				success: false,
				message: 'Enter username length between 6 to 20 characters',
			});
		}

		if (mobileNumber.length !== 10) {
			return res.status(400).json({
				success: false,
				message: 'Mobile number must contain 10 digits',
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
			userId: req.session.user._id,
		});

		if (!addressDoc) {
			addressDoc = new addressSchema({
				userId: req.session.user._id,
				address: [address],
			});
			const savedaddres= await addressDoc.save();
            console.log(21,savedaddres);
            

			return res.status(201).json({
				success: true,
				message: 'Address saved successfully',
				address: address,
			});
		} else {
			addressDoc.address.push(address);
			await addressDoc.save();

			return res.status(201).json({
				success: true,
				message: 'Address saved successfully',
				address: address,
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: 'Error saving address',
		});
	}
};

const orders = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }
        
        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Current page (default: 1)
        const limit = 5; // Number of orders per page
        const skip = (page - 1) * limit; // Number of orders to skip
        
        // Get total count for pagination
        const totalOrders = await OrderSchema.countDocuments({
            userId: req.session.user._id
        });
        
        const totalPages = Math.ceil(totalOrders / limit);
        
        // Get paginated orders
        const userOrders = await OrderSchema.find({
            userId: req.session.user._id,
        })
        .sort({ orderedAt: -1 })
        .skip(skip)
        .limit(limit);
        
        res.render('orders', {
            orders: userOrders,
            user: req.session.user,
            pagination: {
                page,
                limit,
                totalPages,
                totalOrders
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json('error', { message: 'Error fetching orders' });
    }
};

const repay = async (req, res) => {
    try {
        const orderId = req.body.orderId; // Get order ID from request body
        const order = await OrderSchema.findById(orderId);

        if (!order || order.paymentStatus === 'Success') {
            return res.status(400).json({ success: false, message: 'Invalid order for repayment' });
        }

        // Create a new Razorpay order
        const options = {
            amount: order.totalAmount * 100, // Convert to paise
            currency: "INR",
            receipt: order.order_id,
            payment_capture: 1
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Update order status
        order.paymentStatus = 'Pending'; // Update status while retrying
        await order.save();

        // Return the necessary details for Razorpay integration
        res.status(200).json({
            success: true,
            orderId: order.order_id,
            id: order._id,
            amount: order.totalAmount,
            razorpayOrder: razorpayOrder,
            keyId: process.env.RAZORPAY_KEY_ID || '',
            name: req.session.user?.name || 'Customer',
            paymentMethod: 'Online'
        });
    } catch (error) {
        console.error('Retry Payment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retry payment' });
    }
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user?._id;
        const { addressId, paymentMethod, couponCode, total } = req.body;

        // Fetch user cart
        const cart = await CartSchema.findOne({ userId }).populate('productDetails.productId');
        if (!cart || cart.productDetails.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Filter out invalid products
        const validCartItems = cart.productDetails.filter(item => item.productId);
        if (validCartItems.length === 0) {
            return res.status(400).json({ error: 'No valid products in cart. Some may be removed from the store.' });
        }

        if (validCartItems.length !== cart.productDetails.length) {
            await CartSchema.updateOne({ userId }, { $set: { productDetails: validCartItems } });
        }

        // Fetch and validate address
        const addressDoc = await addressSchema.findOne({ userId });
        const selectedAddressDetails = addressDoc?.address?.find(addr => addr._id.toString() === addressId);
        if (!selectedAddressDetails) {
            return res.status(400).json({ error: 'Selected address not found' });
        }

        // Prepare order items
        const orderItems = validCartItems.map(item => {
            if (!item.productId.price || !item.quantity) {
                throw new Error(`Invalid product data for ${item.productId.name || 'unknown product'}`);
            }
            return {
                productId: item.productId._id,
                name: item.productId.name,
                quantity: item.quantity,
                price: item.productId.price,
                totalPrice: item.productId.price * item.quantity,
            };
        });

        // Calculate total amount
	const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

	// Restrict COD for orders above ₹1000
	if (paymentMethod === 'COD' && totalAmount < 1000) {
		return res.status(400).json({ error: 'Cash on Delivery is not available for orders above ₹1000' });
	}


        // Create new order object
        const newOrder = new OrderSchema({
            userId,
            order_id: `ORD-${uuidv4().substr(0, 8).toUpperCase()}`,
            address: [selectedAddressDetails],
            orderItems,
            totalAmount: total,
            paymentMethod,
            paymentStatus: 'Pending',
            orderStatus: 'Placed',
            couponOffer: couponCode,
        });

        // Wallet Payment Handling
        if (paymentMethod === 'Wallet') {
            const userWallet = await walletSchema.findOne({ userId });
            if (!userWallet || userWallet.balance < total) {
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }

            userWallet.balance -= totalAmount;
            await userWallet.save();
        }

        
		
		let razorpayOrder;
    	let paymentStatus = 'Pending'; // Default status

    // Create order in DB first
    const result = await newOrder.save();

    if (paymentMethod === 'Online') {
		// 1
        const options = {
            amount: total * 100, // Convert to paise
            currency: "INR",
            receipt: result.order_id,
            payment_capture: 1
        };
		// 1

        try {
			// 2
            razorpayOrder = await razorpayInstance.orders.create(options);
			// 2
        } catch (error) {
            console.error('Razorpay Order Creation Failed:', error);

            // Update order status to "Failed"
            await OrderSchema.findByIdAndUpdate(result._id, { status: 'Failed' });

            return res.status(500).json({
                error: 'Payment initialization failed',
                details: 'Unable to create Razorpay order. Try again later.',
            });
        }
    }

    // Clear the user's cart
    await CartSchema.findOneAndDelete({ userId });

    // Update product stock only if the payment was successful
    if (paymentMethod !== 'Online' || razorpayOrder) {
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
        paymentStatus = 'Success';
    } else {
        paymentStatus = 'Failed';
    }

    // Update the order status
    await OrderSchema.findByIdAndUpdate(result._id, { status: paymentStatus });
    // Return response
	
	// 3
    res.status(200).json({
        message: paymentStatus === 'Success' ? 'Order placed successfully' : 'Order failed',
        paymentMethod,
        orderId: result.order_id,
        id: result._id,
        amount: result.totalAmount,
        razorpayOrder: razorpayOrder || null,
        keyId: process.env.RAZORPAY_KEY_ID || '',
        name: req.session.user.name,
        status: paymentStatus
    });
	// 3


    } catch (error) {
        console.error('Place Order Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to place order',
            details: 'Please try again or contact support if the problem persists',
        });
    }
};

// apply and remove coupon
const applyCoupon = async (req, res) => {
	try {
		
		const { couponCode } = req.body;
		const userId = req.session.user._id;
		
		//find the couponscode in the db,after checking that expired or not
		const coupon = await CouponSchema.findOne({
			code: couponCode,
			status: true,
			expireDate: { $gt: new Date() }
		});
		console.log(coupon);
		
		//checking the coupon exist or not
		if (!coupon) {
			return res.status(400).json({ success: false, message: "Coupon expired or invalid" });
		}
		//checking the user already apply the coupon or not
		if (coupon.appliedUsers.includes(userId)) {
			return res.status(400).json({ success: false, message: "You have already used this coupon" });
		}
		// Apply the coupon and save user information
		coupon.appliedUsers.push(userId);
		await coupon.save();
		
		return res.json({ success: true,message: "Coupon applied successfully!", discount: coupon.discount });
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
		const order = await OrderSchema.findById(req.params.orderId).populate(
			'orderItems.productId'
		);

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

		res
			.status(200)
			.json({ message: 'Order status updated successfully', order });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Failed to update order status' });
	}
};

const cancelOrder = async (req, res) => {
	try {
		const { orderId, reason } = req.body; 

		const order = await OrderSchema.findById(orderId);
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}

		// Check if the order can be cancelled
		if (order.orderStatus !== 'Placed' && order.orderStatus !== 'Pending') {
			return res.status(400).json({ error: 'Order cannot be cancelled' });
		}

		// Calculate the total amount to be refunded
		const totalAmount = order.orderItems.reduce(
			(total, item) => total + item.price * item.quantity,
			0
		);

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

		 // Refund to wallet if payment was online
		 if (order.paymentMethod === 'online') {
            await walletSchema.findOneAndUpdate(
                { user_id: order.userId },
                {
                    $inc: { balance: totalAmount },
                    $push: {
                        history: {
                            amount: totalAmount,
                            transaction_type: 'credit',
                            description: 'Refund for cancelled order',
                            transaction_id: `REFUND-${order._id}-${Date.now()}`
                        }
                    }
                },
                { upsert: true, new: true } // Create wallet if it doesn't exist
            );
        }
		
		res
			.status(200)
			.json({ message: 'Order cancelled successfully', orderState });
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
			return res
				.status(400)
				.json({ error: 'Return only available for delivered orders' });
		}

		order.returnRequest = {
			requested: true,
			reason: reason,
			status: 'Pending',
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
		const userOrders = await OrderSchema.findById(req.query.id);
		console.log(userOrders);

		res.render('placeOrderInvoice', {
			orders: userOrders,
			user: req.session.user,
		});
	} catch (error) {
		console.error(error);
		res.status(500).render('error', { message: 'Error fetching orders' });
	}
};

const deleteAddress = async (req, res) => {
	try {
		const userId = req.session.user._id;
		const addressId = req.params.addressId;

		// Find the user's address document
		const addressDoc = await addressSchema.findOne({ userId });

		if (!addressDoc) {
			return res.status(404).json({
				success: false,
				message: 'Address not found',
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
						message: 'Address document not found',
					});
				}

				// Find the specific address
				const address = addressDoc.address.find(
					(addr) => addr._id.toString() === addressId
				);

				if (!address) {
					return res.status(404).json({
						success: false,
						message: 'Address not found',
					});
				}

				res.status(200).json({
					success: true,
					address,
				});
			} catch (error) {
				console.error('Get Address Error:', error);
				res.status(500).json({
					success: false,
					message: 'Failed to retrieve address',
					error: error.message,
				});
			}
		};

		const updateAddress = async (req, res) => {
			try {
				const userId = req.session.user._id;
				const addressId = req.params.addressId;
				const { name, mobile, streetAddress, city, landmark, state, pinCode } =
					req.body;

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
						errors: validationErrors,
					});
				}

				// Find the user's address document
				const addressDoc = await addressSchema.findOne({ userId });

				if (!addressDoc) {
					return res.status(404).json({
						success: false,
						message: 'Address document not found',
					});
				}

				// Find the index of the address to update
				const addressIndex = addressDoc.address.findIndex(
					(addr) => addr._id.toString() === addressId
				);

				if (addressIndex === -1) {
					return res.status(404).json({
						success: false,
						message: 'Specific address not found',
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
					createdAt: addressDoc.address[addressIndex].createdAt,
				};

				addressDoc.address[addressIndex] = updatedAddress;

				// Save the updated document
				await addressDoc.save();

				res.status(200).json({
					success: true,
					message: 'Address updated successfully',
					updatedAddress,
				});
			} catch (error) {
				console.error('Update Address Error:', error);
				res.status(500).json({
					success: false,
					message: 'Failed to update address',
					error: error.message,
				});
			}
		};

		// Remove the specific address from the address array
		addressDoc.address = addressDoc.address.filter(
			(addr) => !addr._id.equals(addressId)
		);

		// Save the updated document
		await addressDoc.save();

		res.status(200).json({
			success: true,
			message: 'Address deleted successfully',
		});
	} catch (error) {
		console.error('Delete Address Error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to delete address',
			error: error.message,
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
				message: 'Address document not found',
			});
		}

		// Find the specific address
		const address = addressDoc.addressSchema.find(
			(addr) => addr._id.toString() === addressId
		);

		if (!address) {
			return res.status(404).json({
				success: false,
				message: 'Address not found',
			});
		}

		res.status(200).json({
			success: true,
			address,
		});
	} catch (error) {
		console.error('Get Address Error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to retrieve address',
			error: error.message,
		});
	}
};

const updateAddress = async (req, res) => {
	try {
		const userId = req.session.user._id;
		const addressId = req.params.addressId;
		const { name, mobile, streetAddress, city, landmark, state, pinCode } =
			req.body;

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
				errors: validationErrors,
			});
		}

		// Find the user's address document
		const addressDoc = await addressSchema.findOne({ userId });

		if (!addressDoc) {
			return res.status(404).json({
				success: false,
				message: 'Address document not found',
			});
		}

		// Find the index of the address to update
		const addressIndex = addressDoc.address.findIndex(
			(addr) => addr._id.toString() === addressId
		);

		if (addressIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Specific address not found',
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
			createdAt: addressDoc.address[addressIndex].createdAt,
		};

		addressDoc.address[addressIndex] = updatedAddress;

		// Save the updated document
		await addressDoc.save();

		res.status(200).json({
			success: true,
			message: 'Address updated successfully',
			updatedAddress,
		});
	} catch (error) {
		console.error('Update Address Error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to update address',
			error: error.message,
		});
	}
};

module.exports = {
	checkout,
	addressSave,
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
	cancelRazorpay,
	repay
};
