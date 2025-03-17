const orderSchema = require('../../model/orderModel')
const ExcelJS = require('exceljs');

const orders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        

        let filter = {};
        
        // Validate and parse startDate
        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) { // Check if the date is valid
                filter.orderedAt = {
                    $gte: start
                };
            } else {
                return res.status(400).json({ error: 'Invalid start date' });
            }
        }

        // Validate and parse endDate
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) { // Check if the date is valid
                filter.orderedAt = {
                    ...filter.orderedAt,
                    $lte: end
                };
            } else {
                return res.status(400).json({ error: 'Invalid end date' });
            }
        }

        const orders = await orderSchema.find(filter);

        res.render('orderList', { orders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        const order = await orderSchema.findById(orderId)
            .populate('orderItems.productId')
            .lean(); // Use .lean() to get a plain JavaScript object

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Ensure status is set with a default value if not present
        order.orderItems = order.orderItems.map(item => ({
            ...item,
            status: item.status || 'Placed' 
            
        }));
        res.render('orderDetails', { 
            order, // Pass the order object to the EJS template
            status: ['Placed','Pending', 'Shipped', 'Delivered'] 
        }); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

const updateOrderItem = async (req, res) => {
    try {
        
        const { itemId, status } = req.body;

        const orderItem = await orderSchema.findOne({ 'orderItems._id': itemId });
        
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        
        const item = orderItem.orderItems.find(i => i._id.toString() === itemId);
        
        if (!item) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        console.log(orderItem.orderStatus);
        
        // Define allowed status transitions
        const allowedTransitions = {
            'Placed': ['Pending', 'Shipped', 'Delivered'],
            'Pending': ['Shipped', 'Delivered'],
            'Shipped': ['Delivered'],
            'Delivered': []
        };

       
       
        // Check if the new status is allowed
        if (!allowedTransitions[orderItem.orderStatus].includes(status)) {
            return res.status(400).json({ error: 'Invalid status transition' });
        }
       


        // Update the status
        orderItem.orderStatus = status;
        await orderItem.save();

        res.json({ success: true, order: orderItem });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};




module.exports = {
    orders,
    orderDetails,
    updateOrderItem
   
}