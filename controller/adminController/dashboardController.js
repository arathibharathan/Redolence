const productSchema = require('../../model/productModel')
const categorySchema = require('../../model/categoryModel')
const orderSchema = require('../../model/orderModel')

const getdashBoard = async (req, res) => {
    try {
		
        // Fetch the required data from your database
        const bestSellingProducts = await productSchema.find().sort({ sales: -1 }).limit(10); // Adjust according to your schema
        const bestSellingCategories = await categorySchema.find().sort({ sales: -1 }).limit(10); // Adjust as needed

        const startDate = new Date("2024-01-01T00:00:00.000Z");
        const endDate = new Date("2024-02-01T00:00:00.000Z");
        console.log(startDate);
        

        const orders =  await orderSchema.find({
            orderDate: { $gte: startDate, $lt: endDate }
          });
console.log(orders);


        // Render the dashboard with the fetched data
        res.render('dashboard', {
            bestSellingProducts,
            bestSellingCategories
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};



module.exports = {
	getdashBoard
};