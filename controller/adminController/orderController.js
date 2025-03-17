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
const salesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let filter = {};

        // Validate and parse startDate
        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) {
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
            if (!isNaN(end.getTime())) {
                filter.orderedAt = {
                    ...filter.orderedAt,
                    $lte: end
                };
            } else {
                return res.status(400).json({ error: 'Invalid end date' });
            }
        }

        // Fetch orders with necessary fields
        const orders = await orderSchema.find(filter).populate('orderItems.productId', 'name');

        // Prepare the report data
        const reportData = orders.map(order => {
            return {
                orderId: order.order_id,
                date: order.orderedAt.toLocaleDateString(),
                items: order.orderItems.map(item => item.name).join(', '),
                price: order.orderItems.reduce((total, item) => total + item.price, 0),
                totalAmount: order.totalAmount,
                coupon: order.coupon || 'N/A',
                discount: order.discount || 0
            };
        });

        // Calculate overall metrics
        const totalSalesCount = reportData.length;
        const totalOrderAmount = reportData.reduce((total, report) => total + report.totalAmount, 0);
        const totalDiscount = reportData.reduce((total, report) => total + report.discount, 0);

        res.render('salesReport', { reportData, totalSalesCount, totalOrderAmount, totalDiscount });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


const downloadExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Reuse the same filtering logic from salesReport
        let filter = {};
        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) filter.orderedAt = { $gte: start };
        }
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) filter.orderedAt = { ...filter.orderedAt, $lte: end };
        }

        const orders = await orderSchema.find(filter).populate('orderItems.productId', 'name');

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Define columns
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Items', key: 'items', width: 50 },
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Coupon', key: 'coupon', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 }
        ];

        // Add data rows
        orders.forEach(order => {
            worksheet.addRow({
                orderId: order.order_id,
                date: order.orderedAt.toLocaleDateString(),
                items: order.orderItems.map(item => item.name).join(', '),
                price: order.orderItems.reduce((total, item) => total + item.price, 0),
                totalAmount: order.totalAmount,
                coupon: order.coupon || 'N/A',
                discount: order.discount || 0
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sales_report_${startDate}_to_${endDate}.xlsx`);

        // Send Excel file
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating Excel file');
    }
};

module.exports = {
    orders,
    orderDetails,
    updateOrderItem,
    salesReport,
    downloadExcel
   
}