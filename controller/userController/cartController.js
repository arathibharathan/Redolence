const userSchema = require('../../model/userModel');
const productSchema = require('../../model/productModel');
const cartSchema = require('../../model/cartModel');
const wishlistSchema = require('../../model/wishlistModel');
const { isLogin } = require('../../middleware/userAuth');


// calculate the subtotal in this controller
const cart = async (req, res) => {
  try {
    const userData = await cartSchema.findOne({ userId: req.session.user._id });

    const productDetails = userData?.productDetails?.map(item => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
    })) || [];

    if (productDetails.length === 0) {
      return res.render('cart', { products: [], subtotal: 0 });
    }

    const productIds = productDetails.map(item => item.productId);
    const products = await productSchema.find({ _id: { $in: productIds } });

    // Combine product details with quantity
    const enrichedProducts = products.map(product => {
      const matchedDetail = productDetails.find(
        detail => detail.productId === product._id.toString()
      );
      
      return {
        ...product._doc, // Include all fields of the product
        quantity: matchedDetail?.quantity || 0,
      }; 
    });

    // Calculate subtotal
    const subtotal = enrichedProducts.reduce((total, product) => {
      return total + (product.price || 0) * product.quantity;
    }, 0);

    res.render('cart', { products: enrichedProducts, subtotal });

  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).send("Internal Server Error");
  }
};


  
const addcart = async (req, res) => {
    try {
      
      if(!req.session.user){
        return res.status(404).json({ message: 'User not found, Please Login' });
        
      }
        const productId = req.body.productId;
        
       
        // const discountPrice = req.body.discountElement;
        const userId = req.session.user._id;
        const product = await productSchema.findById(productId);
        // const acualPrice = product.price
        // const discounts = await offerSchema.find()
        // const discountPercentage  = discounts.discount
        // console.log(discountPercentage);
        
        // calculateDiscountPrice(acualPrice,discountPercentage)
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await cartSchema.findOne({ userId: userId });
       
        if (!cart) {
            
            cart = new cartSchema({
                userId: userId,
                productDetails: []
            });
        }

        const existingProductIndex = cart.productDetails.findIndex(
            (item) => item.productId.toString() === productId
        );

        if (existingProductIndex > -1) {
        
            cart.productDetails[existingProductIndex].quantity += 1;
        } else {
            
            cart.productDetails.push({
                productId: productId,
                quantity: 1,
            });
        }

        await cart.save();
        

        res.status(200).json({
            message: 'Product added to cart',
            cart: cart,
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error adding product to cart' });
    }
}; 

const updateCartQuantity = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
  
      if (!productId || !quantity) {
        return res.status(400).json({ success: false, message: 'Invalid input' });
      }
  
      // Update the quantity in the database
      await cartSchema.updateOne(
        { userId: req.session.user._id, 'productDetails.productId': productId },
        { $set: { 'productDetails.$.quantity': quantity } }
     );
  
      res.json({ success: true, message: 'Quantity updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };


  const removeProductFromCart = async (req, res) => {
    try {
      const { productId } = req.body;
 
  
      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is required' });
      }
  

      await cartSchema.updateOne(
        { userId: req.session.user._id },
        { $pull: { productDetails: { productId } } }
      );
  
      res.json({ success: true, message: 'Product removed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  const  wishlist = async (req, res) => {
    try {
        const wishlistItems = await wishlistSchema.findOne({ user: req.session.user._id }).populate('products');


        if (!wishlistItems) {
            return res.render('wishList', { products: [] });
        }

        res.render('wishList', { products: wishlistItems.products });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user._id;

        // create a wishlist for the user
        let wishlist = await wishlistSchema.findOne({ user: userId });
        
        if (!wishlist) {
            wishlist = new wishlistSchema({ user: userId, products: [] });
        }
        // Check if the product is already in the wishlist
        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
            return res.status(200).json({ message: 'Product added to wishlist' });
        } else if(wishlist.products.includes(productId)){
            return res.status(400).json({ message: 'Product is already in wishlist' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const removeProductFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;


    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const userId = req.session.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'user not authentcated'
      })
    }

    

    const result = await wishlistSchema.updateOne(
      { user: userId },
      { $pull: { products: productId } },
      { new: true }
    );
    
    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Failed to remove product"
      })
    }
    
    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




module.exports = {
	cart,
	addcart,
	updateCartQuantity,
	removeProductFromCart,
  wishlist,
  addToWishlist,
  removeProductFromWishlist
};