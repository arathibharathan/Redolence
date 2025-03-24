const orderSchema = require('../../model/orderModel')
const PDFDocument = require('pdfkit');


const getdashBoard = async (req, res) => {
    try {
        // Get current page from query params or default to 1
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Items per page
        
        // By default, show today's orders
        const currentDate = new Date();
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Default filter: today's orders
        let filter = {
            orderedAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };
        
        // Format dates for display
        let formattedStartDate = startOfDay.toISOString().split('T')[0];
        let formattedEndDate = endOfDay.toISOString().split('T')[0];
        let reportType = 'Today\'s Orders';

        // Count total documents for pagination
        const totalOrders = await orderSchema.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch orders with necessary fields with pagination
        const orders = await orderSchema.find(filter)
            .populate('orderItems.productId', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ orderedAt: -1 }); // Sort by latest first

        // Prepare the report data
        const reportData = orders.map(order => {
            return {
                orderId: order.order_id,
                date: order.orderedAt.toLocaleDateString(),
                items: order.orderItems.map(item => {
                    const productName = item.productId ? item.productId.name : 'Unknown Product';
                    return productName;
                }).join(', '),
                price: order.orderItems.reduce((total, item) => total + item.price, 0),
                totalAmount: order.totalAmount,
                coupon: order.coupon || 'N/A',
                discount: order.discount || 0
            };
        });

        // Calculate overall metrics for ALL orders (not just current page)
        // Fetch all orders for accurate totals
        const allOrders = await orderSchema.find(filter);
        const allReportData = allOrders.map(order => {
            return {
                totalAmount: order.totalAmount,
                discount: order.discount || 0
            };
        });
        
        const totalSalesCount = totalOrders;
        const totalOrderAmount = allReportData.reduce((total, report) => total + report.totalAmount, 0);
        const totalDiscount = allReportData.reduce((total, report) => total + report.discount, 0);

        const topProducts = await orderSchema.aggregate([
            { $unwind: "$orderItems" },
            { 
                $group: {
                    _id: "$orderItems.productId",
                    productName: { $first: "$orderItems.name" },
                    totalQuantity: { $sum: "$orderItems.quantity" },
                    totalRevenue: { $sum: "$orderItems.totalPrice" }
                } 
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);
        
        // Get top 10 categories by sales
        const topCategories = await orderSchema.aggregate([
            { $unwind: "$orderItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderItems.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $group: {
                    _id: "$category._id",
                    categoryName: { $first: "$category.name" },
                    totalQuantity: { $sum: "$orderItems.quantity" },
                    totalRevenue: { $sum: "$orderItems.totalPrice" }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
        ]);
        
        // Add these variables to your res.render object:
        res.render('dashboard', { 
            reportData, 
            totalSalesCount, 
            totalOrderAmount, 
            totalDiscount,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            interval: '1', // Default interval set to Daily
            reportType,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: totalPages,
            topProducts,
            topCategories
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


// Add this helper function to dashboardController.js
const getSalesChartData = async (days) => {
    try {
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Format dates in the right format for MongoDB query
        const formattedEndDate = new Date(endDate);
        formattedEndDate.setHours(23, 59, 59, 999);
        const formattedStartDate = new Date(startDate);
        formattedStartDate.setHours(0, 0, 0, 0);
        
        // Get all orders within the date range
        const orders = await orderSchema.find({
            orderedAt: {
                $gte: formattedStartDate,
                $lte: formattedEndDate
            }
        }).sort({ orderedAt: 1 });
        
        // Group orders by date
        const groupedData = {};
        
        // Function to format date as needed
        const formatDate = (date, isMonthly) => {
            const d = new Date(date);
            if (isMonthly) {
                return `${d.toLocaleString('default', { month: 'short' })}`;
            } else {
                return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
            }
        };
        
        // Initialize all dates in the range
        for (let i = 0; i <= days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateKey = formatDate(currentDate, days > 28);
            
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = {
                    sales: 0,
                    orders: 0
                };
            }
        }
        
        // Sum sales and count orders for each day
        orders.forEach(order => {
            const dateKey = formatDate(order.orderedAt, days > 28);
            
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = {
                    sales: 0,
                    orders: 0
                };
            }
            
            groupedData[dateKey].sales += order.totalAmount;
            groupedData[dateKey].orders += 1;
        });
        
        // Convert to arrays for ApexCharts
        const dates = Object.keys(groupedData);
        const salesData = dates.map(date => Math.round(groupedData[date].sales));
        const ordersData = dates.map(date => groupedData[date].orders);
        
        return {
            dates,
            salesData,
            ordersData
        };
    } catch (error) {
        console.error("Error in getSalesChartData:", error);
        return {
            dates: [],
            salesData: [],
            ordersData: []
        };
    }
};



const getSalesReport = async (req, res) => {
    try {
        let { startDate, endDate, interval, page } = req.query;
        interval = interval || '1'; // Default to daily if not provided
        page = parseInt(page) || 1; // Default to page 1
        const limit = 10; // Items per page
        
        let filter = {}; // No status filter by default to show all orders
        let currentDate = new Date();
        let reportType = 'Daily Report'; // Default report type label
        
        // Handle interval selection
        let start, end;
        
        if (interval !== 'custom') {
            // Set default date range based on interval
            end = new Date(currentDate);
            end.setHours(23, 59, 59, 999);
            
            start = new Date(currentDate);
            
            switch (interval) {
                case '1': // Daily
                    start.setHours(0, 0, 0, 0); // Start of today
                    reportType = 'Today\'s Orders';
                    break;
                case '7': // Weekly
                    start.setDate(currentDate.getDate() - 7);
                    reportType = 'Weekly Report';
                    break;
                case '30': // Monthly
                    start.setMonth(currentDate.getMonth() - 1);
                    reportType = 'Monthly Report';
                    break;
                case '365': // Yearly
                    start.setFullYear(currentDate.getFullYear() - 1);
                    reportType = 'Yearly Report';
                    break;
                default:
                    start.setDate(currentDate.getDate() - 7); // Default to weekly
                    reportType = 'Weekly Report';
            }
            
            // Override with provided dates if they exist
            startDate = startDate ? new Date(startDate) : start;
            endDate = endDate ? new Date(endDate) : end;
        } else {
            // Custom range selected
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start and end dates are required for custom range' });
            }
            
            // Parse provided dates
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            
            // Validate dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }
            
            reportType = 'Custom Range Report';
        }
        
        // Ensure end date includes the full day
        endDate.setHours(23, 59, 59, 999);
        
        // Set the date filter
        filter.orderedAt = {
            $gte: startDate,
            $lte: endDate
        };

        // Count total documents for pagination
        const totalOrders = await orderSchema.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch orders with necessary fields with pagination
        const orders = await orderSchema.find(filter)
            .populate('orderItems.productId', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ orderedAt: -1 }); // Sort by latest first

        // Prepare the report data
        const reportData = orders.map(order => {
            return {
                orderId: order.order_id,
                date: order.orderedAt.toLocaleDateString(),
                items: order.orderItems.map(item => {
                    const productName = item.productId ? item.productId.name : 'Unknown Product';
                    return productName;
                }).join(', '),
                price: order.orderItems.reduce((total, item) => total + item.price, 0),
                totalAmount: order.totalAmount,
                coupon: order.coupon || 'N/A',
                discount: order.discount || 0
            };
        });

        // Calculate overall metrics for ALL orders (not just current page)
        // Fetch all orders for accurate totals
        const allOrders = await orderSchema.find(filter);
        const allReportData = allOrders.map(order => {
            return {
                totalAmount: order.totalAmount,
                discount: order.discount || 0
            };
        });
        
        const totalSalesCount = totalOrders;
        const totalOrderAmount = allReportData.reduce((total, report) => total + report.totalAmount, 0);
        const totalDiscount = allReportData.reduce((total, report) => total + report.discount, 0);

        // Calculate the number of days between start and end date
        const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Generate chart data for the selected period
        let chartData = await getSalesChartData(daysDifference);
        
        // Also fetch standard period data for weekly/monthly views
        const weeklyData = await getSalesChartData(7);
        const monthlyData = await getSalesChartData(30);
        
        // Get top products and categories if we're on the dashboard
        let topProducts = [];
        let topCategories = [];
        
                // Get top 10 products by sales
            topProducts = await orderSchema.aggregate([
                { $unwind: "$orderItems" },
                { 
                    $group: {
                        _id: "$orderItems.productId",
                        productName: { $first: "$orderItems.name" },
                        totalQuantity: { $sum: "$orderItems.quantity" },
                        totalRevenue: { $sum: "$orderItems.totalPrice" }
                    } 
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 }
            ]);
            
            // Get top 10 categories by sales
            topCategories = await orderSchema.aggregate([
                { $unwind: "$orderItems" },
                {
                    $lookup: {
                        from: "products",
                        localField: "orderItems.productId",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "product.category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                { $unwind: "$category" },
                {
                    $group: {
                        _id: "$category._id",
                        categoryName: { $first: "$category.name" },
                        totalQuantity: { $sum: "$orderItems.quantity" },
                        totalRevenue: { $sum: "$orderItems.totalPrice" }
                    }
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 }
            ]);
        

        // Format dates for the view
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        res.render('dashboard', { 
            reportData, 
            totalSalesCount, 
            totalOrderAmount, 
            totalDiscount,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            interval,
            reportType,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: totalPages,
            chartData,  // Current interval's chart data
            weeklyChartData: weeklyData,
            monthlyChartData: monthlyData,
            topProducts,
            topCategories
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


module.exports = {
    getdashBoard,
    getSalesReport
};