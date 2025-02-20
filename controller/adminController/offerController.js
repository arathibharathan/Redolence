const productSchema = require('../../model/productModel')
const offerSchema = require('../../model/offerModel')
const CategorySchema = require('../../model/categoryModel')


const productOffers = async (req, res) => {
    try {
        res.render('productOffers');
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// API endpoints to support the UI
const getOffers = async (req, res) => {
    try {
        const offers = await offerSchema.find().populate('applicableProduct');
        console.log(offers,'---------->>>>>>>>')
        res.json({ data: offers });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await productSchema.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

const createOffer = async (req, res) => {
    try {
        const offer = new offerSchema(req.body); // Use req.body directly
        await offer.save();
        res.json(offer);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create offer', message: error.message });
    }
};

const deleteOffer = async (req, res) => {
    try {
        await offerSchema.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete offer' });
    }
};
const offers = async (req, res) => {
    try {
        const offers = await offerSchema.find({ offerType: 'product' })
            .populate('applicableProduct', 'name')
            .lean();
        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// category

const getCategories = async (req, res) => {
    try {
      const categories = await CategorySchema.find({}, 'name _id'); 
      res.json(categories); 
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const categoryOffers = async (req, res) => {
    try {
        res.render('categoryOffers');
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

const getCategoryOffers = async (req, res) => {
    try {
        const offers = await offerSchema.find({ offerType: 'category' }) 
            .populate('applicableProduct', 'name');
        res.json({ data: offers });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

const createCategoryOffer = async (req, res) => {
    try {
      const newOffer = new offerSchema(req.body);
      await newOffer.save();
      res.status(201).json({ message: 'Offer created successfully', offer: newOffer });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

const getCategoryOfferById = async (req, res) => {
    try {
        const offer = await offerSchema.findById(req.params.id)
            .populate('applicableProduct', 'name');
        res.json(offer);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateCategoryOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedOffer = await offerSchema.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true }
        ).populate('applicableProduct', 'name');
        
        res.json({ message: 'Offer updated successfully', offer: updatedOffer });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

const deleteCategoryOffer = async (req, res) => {
    try {
        await offerSchema.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const referralOffers = async (req, res) => {
    try {
        res.render('referralOffers');
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}; 

module.exports = {
    productOffers,
     getOffers,
     getProducts,
     createOffer,
     deleteOffer,
     offers,

     getCategories,
     categoryOffers,
     getCategoryOffers,
     createCategoryOffer,
     getCategoryOfferById,
     updateCategoryOffer,
     deleteCategoryOffer,

     referralOffers
}