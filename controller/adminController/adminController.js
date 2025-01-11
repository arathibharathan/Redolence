const adminSchema = require('../../model/userModel');
const adminRouter = require('../../router/adminRouter');
const Category = require('../../model/categoryModel')
const productSchema = require('../../model/product')



const getLoginPage = async (req,res)=>{
	try {
		res.render('adminLog');
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error", message: error.message });
	}
}

const adminCheck = async(req,res)=>{
	try {
		const { username, password } = req.body
		let adminCheck = await adminSchema.findOne({ username: username })
		if(adminCheck === null){
			return res.status(400).json({ success: false, message: 'User not Found!' });
		}else if(adminCheck.password !== password ){	
			return res.status(400).json({ success: false, message: 'password not mathching ' });		
		}else if(adminCheck.is_admin === false){
			return res.status(400).json({ success: false, message: 'not an admin ' });
		} else {
            req.session.admin = adminCheck
			return res.status(200).json({ success: true, message: 'signin successful'})
		}
		
		
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error", message: error.message });
		
	}
}

const getdashBoard = async (req,res)=>{
	try {
		res.render('dashboard')
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error", message: error.message });
	}
}


const getUserList = async (req,res)=>{
	try {
		let userList = await adminSchema.find({is_admin: false})
		res.render('userList', {userList})

	} catch (error) {
		res.status(500).json({ error: "Internal Server Error", message: error.message });
		
	}
}


const blockUser = async (req, res) => {
    try {
        const { id } = req.body; // Extract the user ID from the request body

        
        let userBlock = await adminSchema.findById(id);   // Find the user by ID using the adminSchema
        
        if (!userBlock) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the user's is_block status
        userBlock.is_block = true;
        await userBlock.save(); // Save the updated user
        res.status(200).json({ message: "User blocked successfully", user: userBlock });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while blocking the user" });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { id } = req.body;


        let userUnblock = await adminSchema.findById(id);   // Find the user by ID using the adminSchema
        
        if (!userUnblock) {
            return res.status(404).json({ message: "User not found" });
        }

        
        userUnblock.is_block = false;    
        await userUnblock.save();
        res.status(200).json({ message: "User unblocked successfully", user: userUnblock });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while unblocking the user" });
    }
};


const renderCategoryPage = async (req,res)=>{
	try {
		const category = await Category.find({}) 
		res.render('category',{category})
	} catch (error) {
		res.status(500).json({ error: "Internal Server Error", message: error.message });
		
	}
}

const createCategory = async (req, res) => {
    try {
            app.post('/api/edit-category', (req, res) => {
            const { name, description, status } = req.body;
          
            // Simulate database operation
            const success = true; // Assume operation succeeded
          
            if (success) {
              res.status(200).json({ message: 'Category updated successfully!' });
            } else {
              res.status(400).json({ message: 'Failed to update category.' });
            }
          });
          
        
    } catch (error) {
        res.status(500).json({success: false,message: 'Internal server error', error: error.message  });
    }
};

const categoryCheck = async (req,res)=>{
try {
    const { name,description,status } = req.body
    const existingCategory = await Category.findOne({ name: name });
    if (existingCategory) {
      return res.status(409).json({success: false, message: 'Category already exists',});
    }
    
    const newCategory = new Category({
      name: name.trim(),
      description: description,
      status:status
    });

    await newCategory.save();

    res.status(200).json({success: true,message: 'Category added successfully'});
    
} catch (error) {
    res.status(500).json({ success: false, message: 'An error occurred while adding the category'})
}
}

const updateCategory =  (req,res)=>{
try {
    console.log(req.body);
    
} catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
    
}
}

const getCatForEdit = async (req, res) => {
    try {
        const { id } = req.query; // Fetching the category ID from the query string
        const category = await Category.findById(id); // Querying MongoDB for the category by ID

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category); // Return the category data in the response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const editCategory = async (req,res)=>{
    try {
        const { name,description,status,id } = req.body

        const update = await Category.updateOne({ _id: id }, { name: name, description: description, status: status })

        res.json({ success: true })
    } catch (error) {
        
    }
}


const getProductAdd =  async (req,res)=>{
	try {
        const allCategory = await Category.find({})
		res.render('productAdd', { allCategory })
	} catch (error) {
		console.log(error);
	}
}

const addProduct = async (req,res)=>{
    try {
        const { name, description, price, productCount, category } = req.body;

      
        if (!name || !description || !price || !productCount || !category) {
            return res.json({ success: false, message: 'All fields are required' });
        }

        console.log('Files:', req.files); // Debugging

        
        const imageFiles = req.files.map(file => file.filename);

        const newProduct = new productSchema({
            name,
            description,
            price,
            productCount,
            category, 
            images: imageFiles,
        });

        await newProduct.save();

        res.json({ success: true, message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

const getProductList = async (req,res)=>{
	try {
		const products = await productSchema.find({})
		res.render('productList', { products })
	} catch (error) {
		console.log(error);
		
	}
}

const editProduct = async (req,res)=>{
    try {
		const productData = await productSchema.findOne({ _id: req.query._id })
        const category = await Category.find({})
        res.render('editProduct', { productData, category })

        
    } catch (error) {
        console.log(error);   
    }
}

const checkEditProduct = async (req,res)=>{
    try {
        const images = req.files.map(file => file.filename);
        
        const productData = {
            name: req.body['productTitle'],
            description: req.body['ProductDescription'],
            images: images,
            category: req.body['categorySelection'],
            is_listed: req.body['productOption'],
            stock: parseInt(req.body['productCount']),
            price: parseFloat(req.body['productPrice'])
        };

        const newProduct = new Products(productData);
        await newProduct.save();

        res.status(200).json({ success: true, message: 'Product added successfully', redirectUrl: '/admin/products' });




        // const { name, description, price, productCount, category, id } = req.body
		await productSchema.updateOne({ _id: id }, { name: name, description: description,images:images, price: price, category: category, stock: productCount })
        res.json({ success: true })
    } catch (error) {
        console.log(error);   
    }
}

const blockProduct = async (req,res)=>{
    try {
        const product = await productSchema.findOne({ _id: req.query._id })
        if(product.is_block == true) {
            await productSchema.updateOne({ _id: req.query._id }, { is_block: false })
        } else {
            await productSchema.updateOne({ _id: req.query._id }, { is_block: true })
        }
        res.json({ success: true })
    } catch (error) {
        console.log(error);   
    }
}

const blockCategory = async (req,res)=>{
    try {
        const category = await Category.findOne({ _id: req.query._id })
        if(category.status == 'unlisted') {
            await Category.updateOne({ _id: req.query._id }, { status: 'listed' })
        } else {
            await Category.updateOne({ _id: req.query._id }, { status: 'unlisted' })
        }
        res.json({ success: true })
    } catch (error) {
        console.log(error);   
    }
}


module.exports = {
    getLoginPage,
	adminCheck,
	getdashBoard,
	getProductList, 
	getUserList,
	blockUser,
	unblockUser,
	getProductAdd,
	renderCategoryPage,
	createCategory,
    categoryCheck,
    updateCategory,
    getCatForEdit,
    editCategory,
    editProduct,
    addProduct,
    checkEditProduct,
    blockProduct,
    blockCategory
}