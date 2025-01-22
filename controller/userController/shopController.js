const productSchema = require('../../model/productModel');


const shop = async (req, res) => {
	try {
		const products = await productSchema.find({});
		res.render('shop', { products });
	} catch (error) {
		console.log(error);
	}
};

const product = async (req, res) => {
	try {
		const product = await productSchema.findOne({ _id: req.query.id });
		res.render('product', { product });
	} catch (error) {
		console.log(error);
	}
};
















const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page from query, default to 1
        const limit = parseInt(req.query.limit) || 10; // Get the limit from query, default to 10
        const skip = (page - 1) * limit; // Calculate the number of documents to skip

        const products = await Product.find().skip(skip).limit(limit); // Fetch products with pagination
        const totalProducts = await Product.countDocuments(); // Get total number of products

        res.json({
            success: true,
            products,
            totalPages: Math.ceil(totalProducts / limit), // Calculate total pages
            currentPage: page,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




module.exports = {
	shop,
	product,
	getProducts
};
