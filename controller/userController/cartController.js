const userSchema = require('../../model/userModel');
const productSchema = require('../../model/productModel');
const cartSchema = require('../../model/cartModel');


// calculate the subtotal in this controller
const cart = async (req, res) => {
    try {
      const userData = await cartSchema.findOne({ userId: req.session.user._id });
  
      const productDetails = userData.productDetails.map(item => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
      }));
  
      const productIds = productDetails.map(item => item.productId);
  
      const products = await productSchema.find({ _id: { $in: productIds } });
  
      // Combine the product details with the quantity
      const enrichedProducts = products.map(product => {
        const matchedDetail = productDetails.find(
          detail => detail.productId === product._id.toString()
        );
        return {
          ...product._doc, // Include all fields of the product
          quantity: matchedDetail ? matchedDetail.quantity : 0,
        };
      });
  
      // Calculate subtotal
      const subtotal = enrichedProducts.reduce((total, product) => {
        return total + (product.price || 0) * product.quantity;
      }, 0);
  
      res.render('cart', { products: enrichedProducts, subtotal });
    } catch (error) {
      console.error(error);
    }
  };
const addcart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user._id;

        const product = await productSchema.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await cartSchema.findOne({ userId: userId });

        if (!cart) {
            
            cart = new cartSchema({
                userId: userId,
                productDetails: [],
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





module.exports = {
	cart,
	addcart,
	updateCartQuantity,
	removeProductFromCart
};