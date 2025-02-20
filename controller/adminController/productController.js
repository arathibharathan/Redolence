const Category = require('../../model/categoryModel');
const productSchema = require('../../model/productModel');
const path = require('path')
const fs =require('fs')

const getProductAdd = async (req, res) => {
	try {
		const allCategory = await Category.find({});
		res.render('addProduct', { allCategory });
	} catch (error) {
		console.log(error);
	}
};

const addProduct = async (req, res) => {
    try {
        const images = req.files.map(file => file.filename);
        
        const productData = {
            name: req.body['productTitle'],
            description: req.body['ProductDescription'],
            images: images,
            category: req.body['categorySelection'],
            is_list: req.body['productOption'],
            stock: parseInt(req.body['productCount']),
            price: parseFloat(req.body['productPrice'])
        };

        const newProduct = new productSchema(productData);
        await newProduct.save();

        res.status(200).json({ success: true, message: 'Product added successfully', redirectUrl: '/admin/productList' });
    } catch (error) {
        console.error('Error Adding Product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const getProductList = async (req, res) => {
	try {
		const products = await productSchema.find({}).populate('category');
		res.render('productList', { products });
	} catch (error) {
		console.log(error);
	}
};

const editProduct = async (req, res) => {
	try {
		const productData = await productSchema.findOne({ _id: req.query._id });
		const category = await Category.find({});
		res.render('editProducts', { productData, category });
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
			is_list: req.body['productOption'],
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

const updateProduct = async (req, res) => {
    try {
        const hiddenId = req.body['hiddenid'];
        const existingProduct = await productSchema.findById(hiddenId);

        let images = [];

        for (let i = 1; i <= 3; i++) {
            const fieldName = `productImage${i}`;
            if (req.body[fieldName] && req.body[fieldName].startsWith('data:image')) {
               
                const base64Data = req.body[fieldName].replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const imageName = `cropped_product_${hiddenId}_${i}.jpg`;
                const imagePath = path.join(__dirname, '../../uploads/', imageName);
                
                fs.writeFileSync(imagePath, buffer);
                images.push(imageName);
            } else if (req.body[`existingImage${i}`]) {
                images.push(req.body[`existingImage${i}`]);
            }
        }

        await productSchema.findByIdAndUpdate(hiddenId, {
            $set: {
                name: req.body['productTitle'],
                description: req.body['ProductDescription'],
                images: images,
                category: req.body['categorySelection'],
                is_list: req.body['productOption'],
                stock: parseInt(req.body['productCount']),
                price: parseFloat(req.body['productPrice'])
            }
        });

        res.status(200).json({ success: true, message: 'Product updated successfully', redirectUrl: '/admin/productList' });
    } catch (error) {
        console.error('Error Updating Product:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
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

const searchProducts = async (req, res) => {
    const searchTerm = req.query.q || '';
    const page = parseInt(req.query.page) || 1; // Get the current page
    const limit = parseInt(req.query.limit) || 10; // Set the number of items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip

    try {
        const products = await productSchema.find({
            name: { $regex: searchTerm, $options: 'i' }
        }).populate('category').skip(skip).limit(limit);

        const totalProducts = await productSchema.countDocuments({
            name: { $regex: searchTerm, $options: 'i' }
        });

        res.json({
            products,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
}









module.exports = {
	getProductList,
	getProductAdd,
	editProduct,
	addProduct,
	checkEditProduct,
	blockProduct,
	updateProduct,
	searchProducts,
};