const userSchema = require('../../model/userModel');
const productSchema = require('../../model/productModel');

const home = async (req, res) => {
    try {
        let User;
        if (req.session.user) {
            User = await userSchema.find({ _id: req.session.user._id });
        } else {
            User = undefined;
        }

        // Fetch recent products
        const recentProducts = await productSchema.find({ is_list: true })
            .sort({ createdAt: -1 })
            .limit(9)
            .populate('category');

        // Fetch best selling products
        const bestSellingProducts = await productSchema.find({ is_list: true })
            .sort({ category: -1 }) // filter field category
            .limit(3)
            .populate('category');

        res.render('home', { User, recentProducts, bestSellingProducts });
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
	home
};
