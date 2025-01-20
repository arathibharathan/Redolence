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






module.exports = {
	shop,
	product
};
