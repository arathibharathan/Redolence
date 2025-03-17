const productSchema = require('../../model/productModel')
const offerSchema = require('../../model/offerModel')
const CategorySchema = require('../../model/categoryModel')

const   loadOffer = async(req,res)=>{
    try {
        const [offer, products] = await Promise.all([
            offerSchema.find({ type: "PRODUCT" }),
            productSchema.find({ is_list: true })
          ]);
          
        res.render('productOffer',{products,offer})
    } catch (error) {
        
    }
}
const addOffer= async(req,res)=>{

    try {
        
        const { title, description, discount, products, status, type } = req.body;
        
        if(type =='PRODUCT'){

       
        const newOffer = new offerSchema({
            title,
            description,
            discount,
            type,
            products,
            status
        });

        await newOffer.save();
        
        
        res.status(201).json({ success: true, message: 'Offer added successfully' , redirectUrl:'/admin/Offers'});
        }else{
            const newOffer = new offerSchema({
                title,
                description,
                discount,
                type,
                category:products,
                status
            });
    
            await newOffer.save();
            
            
            res.status(201).json({ success: true, message: 'Offer added successfully' , redirectUrl:'/admin/offers/category'});
        }
    } catch (error) {
        console.log(error);
        
    }
}

const loadCateOffer =async(req,res)=>{
    try {
        const [offer, category] = await Promise.all([
            offerSchema.find({ type: "CATEGORY" }),
            CategorySchema.find({ status: "listed" })
          ]);
          
        res.render('categoryOffer',{category,offer})
    } catch (error) {
        console.log(error);
        
    }
}

const updateOffer = async (req, res) => {
    try {
        const { title, description, discount, products, status, type, id } = req.body

        if(type == 'CATEGORY'){
            const updatedOffer = await offerSchema.findByIdAndUpdate(id, {
                $set: {
                    title,
                    description,
                    discount,
                    type,
                    category: products,
                    status
                }
            }, { new: true });
            if (!updatedOffer) {
                return res.status(404).json({ success: false, message: 'Offer not found' });
            }
            res.status(200).json({ success: true, message: 'Offer updated successfully', redirectUrl: '/admin/offers/category' });
        }else{
        const updatedOffer = await offerSchema.findByIdAndUpdate(id, {
            $set: {
                title,
                description,
                discount,
                type,
                products,
                status
            }
        }, { new: true });
        if (!updatedOffer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        res.status(200).json({ success: true, message: 'Offer updated successfully', redirectUrl: '/admin/offers/offers' });
    }
    
        

        

    } catch (error) {
        console.log('Error updating offer:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


const deleteOffer = async (req, res) => {
    try {
        const offerId = req.body.id;
        await offerSchema.findByIdAndDelete(offerId);

        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ success: false, message: 'Error deleting offer' });
    }
};

module.exports = {
    loadOffer,
    addOffer,
    loadCateOffer,
    updateOffer,
    deleteOffer
}
