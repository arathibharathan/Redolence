const productSchema = require('../../model/productModel');
const CategorySchema = require('../../model/categoryModel')


const shop = async (req, res) => {
    try {
        const { page = 1 } = req.params; 
        const { sort, category } = req.query; 
        const skip = (page - 1) * 4;
        const limit = 4;

        let sortCriteria;
        switch (sort) {
            case 'popularity':
                sortCriteria = { popularity: -1 }; 
                break;
            case 'price-asc':
                sortCriteria = { price: 1 };
                break;
            case 'price-desc':
                sortCriteria = { price: -1 };
                break;
            case 'average-rating':
                sortCriteria = { averageRating: -1 }; 
                break;
            case 'featured':
                sortCriteria = { featured: -1 }; 
                break;
            case 'new-arrivals':
                sortCriteria = { createdAt: -1 }; 
                break;
            case 'a-z':
                sortCriteria = { name: 1 };
                break;
            case 'z-a':
                sortCriteria = { name: -1 };
                break;
            default:
                sortCriteria = { createdAt: -1 }; 
        }

        // Fetch categories
        const categories = await CategorySchema.find({}); // Ensure this line is present

        // Build the query based on the category
        const query = {};
        if (category) {
            query.category = categoryId; // Filter by category if provided
        }
        console.log(category);
        

        
        const products = await productSchema.find(query)
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit);

        const totalProducts = await productSchema.countDocuments(query);
        const pages = Math.ceil(totalProducts / limit); 
        res.render('shop', { products, categories, pages, nextPage: parseInt(page) + 1, prevPage: parseInt(page) - 1, sort, category, page: parseInt(page) });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error"); // Handle errors gracefully
    }
};

const renderKartByPage = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store");
        const { page = 1 } = req.params; 
        const { sort } = req.query; 
        const skip = (page - 1) * 8;
        const limit = 8;

        let sortCriteria;
        switch (sort) {
            case 'popularity':
                sortCriteria = { popularity: -1 }; 
                break;
            case 'price-asc':
                sortCriteria = { price: 1 };
                break;
            case 'price-desc':
                sortCriteria = { price: -1 };
                break;
            case 'average-rating':
                sortCriteria = { averageRating: -1 }; 
                break;
            case 'featured':
                sortCriteria = { featured: -1 }; 
                break;
            case 'new-arrivals':
                sortCriteria = { createdAt: -1 }; // Sort by createdAt for new arrivals
                break;
            case 'a-z':
                sortCriteria = { name: 1 };
                break;
            case 'z-a':
                sortCriteria = { name: -1 };
                break;
            default:
                sortCriteria = { createdAt: -1 }; // Default to sorting by createdAt
        }

        const products = await productSchema.find({})
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit);

        const totalProducts = await productSchema.countDocuments({});
        const pages = Math.ceil(totalProducts / limit); 

        res.render('shop', { products, pages, nextPage: parseInt(page) + 1, prevPage: parseInt(page) - 1, sort, page: parseInt(page) });
    } catch (error) {
        console.log(error);
    }
};

const product = async (req, res) => {
	try {
		const product = await productSchema.findOne({ _id: req.query.id });
        const category = product.category
        
        const relatedProducts = await productSchema.find({category}).limit(4);
        
		res.render('product', { product ,relatedProducts});
	} catch (error) {
		console.log(error);
	}
};

const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit; 
        
        const products = await productSchema.find().skip(skip).limit(limit).sort({price:1}); 
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





module.exports = {
	shop,
	product,
	getProducts,
    renderKartByPage
};
