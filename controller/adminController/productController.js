const Category = require('../../model/categoryModel');
const productSchema = require('../../model/productModel');


const getProductAdd = async (req, res) => {
	try {
		const allCategory = await Category.find({});
		res.render('productAdd', { allCategory });
	} catch (error) {
		console.log(error);
	}
};

const addProduct = async (req, res) => {
	try {
		const { name, description, price, productCount, category,is_listed } = req.body;

		if (!name || !description || !price || !productCount || !category || !is_listed) {
			return res.json({ success: false, message: 'All fields are required' });
		}

		console.log('Files:', req.files); // Debugging

		const imageFiles = req.files.map((file) => file.filename);

		const newProduct = new productSchema({
			name,
			description,
			price,
			productCount,
			category,
			images: imageFiles,
			is_listed:is_listed
		});

		await newProduct.save();

		res.json({
			success: true,
			message: 'Product added successfully',
			product: newProduct,
		});
	} catch (error) {
		console.error(error);
		res.json({ success: false, message: error.message });
	}
};

const getProductList = async (req, res) => {
	try {
		const products = await productSchema.find({});
		res.render('productList', { products });
	} catch (error) {
		console.log(error);
	}
};

const editProduct = async (req, res) => {
	try {
		const productData = await productSchema.findOne({ _id: req.query._id });
		const category = await Category.find({});
		res.render('editProduct', { productData, category });
	} catch (error) {
		console.log(error);
	}
};

const checkEditProduct = async (req, res) => {
	try {
		const images = req.files.map((file) => file.filename);

		const productData = {
			name: req.body['productTitle'],
			description: req.body['ProductDescription'],
			images: images,
			category: req.body['categorySelection'],
			is_listed: req.body['productOption'],
			stock: parseInt(req.body['productCount']),
			price: parseFloat(req.body['productPrice']),
		};

		const newProduct = new Products(productData);
		await newProduct.save();

		res
			.status(200)
			.json({
				success: true,
				message: 'Product added successfully',
				redirectUrl: '/admin/products',
			});

		// const { name, description, price, productCount, category, id } = req.body
		await productSchema.updateOne(
			{ _id: id },
			{
				name: name,
				description: description,
				images: images,
				price: price,
				category: category,
				stock: productCount,
			}
		);
		res.json({ success: true });
	} catch (error) {
		console.log(error);
	}
};

const blockProduct = async (req, res) => {
	try {
		const product = await productSchema.findOne({ _id: req.query._id });
		if (product.is_block == true) {
			await productSchema.updateOne(
				{ _id: req.query._id },
				{ is_block: false }
			);
		} else {
			await productSchema.updateOne({ _id: req.query._id }, { is_block: true });
		}
		res.json({ success: true });
	} catch (error) {
		console.log(error);
	}
};








module.exports = {
	getProductList,
	getProductAdd,
	editProduct,
	addProduct,
	checkEditProduct,
	blockProduct,
};