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
            .sort({ salesCount: -1 }) // Assuming you have a salesCount field
            .limit(4)
            .populate('category');

        res.render('home', { User, recentProducts, bestSellingProducts });
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
	home
};
