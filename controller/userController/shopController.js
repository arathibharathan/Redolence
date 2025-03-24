const productSchema = require('../../model/productModel');
const CategorySchema = require('../../model/categoryModel');
offerSchema = require('../../model/offerModel');

const shop = async (req, res) => {
    try {
        const perPage = 9;
        
        // Get query parameters
        const page = parseInt(req.query.page) || 1;
        const sort = req.query.sort || 'newest'; // show the products depends on the sorting or the newest first
        const search = req.query.search || ''; 
        const categoryFilter = req.query.category
            ? req.query.category.split(',')
            : [];
            

        // Build filter query
		let filterQuery = { is_list: true }; // Only show active products
        
        // Add category filter if present
        if (categoryFilter.length) {
            filterQuery.category = { $in: categoryFilter };
        }
        
        // Add search filter if present
        if (search && search.trim() !== '') {
            filterQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort query
        let sortQuery = {};
        switch (sort) {
            case 'price-asc':
                sortQuery.price = 1;
                break;
            case 'price-desc':
                sortQuery.price = -1;
                break;
            case 'a-z':
                sortQuery.name = 1;
                break;
            case 'z-a':
                sortQuery.name = -1;
                break;
            case 'newest':
            default:
                sortQuery.createdAt = -1;
                break;
        }

        // Count total products for pagination
        const totalProducts = await productSchema.countDocuments(filterQuery);
        const pages = Math.ceil(totalProducts / perPage);

        // Get products with pagination, filtering, and sorting
        const allProducts = await productSchema
            .find(filterQuery)
            .sort(sortQuery)
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('category')
            .lean();

        // Get all categories for the filter sidebar
        const categories = await CategorySchema.find().lean();

        // Fetch active offers
        const offers = await offerSchema.find({
            status: 'active',
        });

        // Process each product with offers
        const productsWithOffers = allProducts.map((product) => {
            // Find all offers applicable to this product
            const productOffers = offers.filter((offer) =>
                offer.products.includes(product._id)
            );
            const categoryOffers = offers.filter((offer) =>
                offer.category.includes(product.category._id)
            );

            // Merge both offers
            const applicableOffers = [...productOffers, ...categoryOffers];

            // Find the highest discount offer
            let highestOffer = applicableOffers.reduce(
                (max, offer) => {
                    return offer.discount > max.discount ? offer : max;
                },
                { discount: 0 }
            );
            
            // Apply the highest discount
            const offerPrice =
                highestOffer.discount > 0
                    ? product.price * (1 - highestOffer.discount / 100)
                    : product.price;

            return {
                ...product,
                originalPrice: product.price,
                offerPrice,
                highestDiscount: highestOffer.discount,
                appliedOffer:
                    highestOffer.discount > 0 ? highestOffer.title : 'No Offer',
            };
        });

        // Render the shop page with all the data
        res.render('shop', {
            categories,
            page,
            pages,
            prevPage: page > 1 ? page - 1 : 1,
            nextPage: page < pages ? page + 1 : pages,
            sort,
            search, // Pass the search parameter to the view
            categoryFilter, 
            products: productsWithOffers,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const getProducts = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const products = await productSchema
			.find()
			.skip(skip)
			.limit(limit)
			.sort({ price: 1 });
		const totalProducts = await productSchema.countDocuments();

		res.json({
			success: true,
			products,
			totalPages: Math.ceil(totalProducts / limit),
			currentPage: page,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

const product = async (req, res) => {
	try {
		const product = await productSchema.findOne({ _id: req.query.id });
		const category = product.category;

		const relatedProducts = await productSchema.find({ category }).limit(4);

		res.render('product', { product, relatedProducts });
	} catch (error) {
		console.log(error);
	}
};

module.exports = {
	shop,
	product,
	getProducts
};
