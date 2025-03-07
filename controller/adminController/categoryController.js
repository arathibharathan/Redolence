const CategorySchema = require('../../model/categoryModel');

const renderCategoryPage = async (req, res) => {
	try {
		const category = await CategorySchema.find({});
		res.render('category', { category });
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Internal Server Error', message: error.message });
	}
};

const addCategory = async (req, res) => {
	try {
			const { name, description, status } = req.body;

			// Check if the category already exists
			const existingCategory = await CategorySchema.findOne({ name });

			if (existingCategory) {
			  return res.status(400).json({ success: false, message: 'Category already exists' });
			}


			  // Create a new category`
			  const newCategory = new CategorySchema({ name, description, status });
			  await newCategory.save();

			  res.status(200).json({ success: true, message: 'Category created successfully!' }); 

	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message,
		});
	}
};
const categoryCheck = async (req, res) => {
	try {
		const { name, description, status } = req.body;
		const existingCategory = await CategorySchema.findOne({ name: name });
		if (existingCategory) {
			return res
				.status(409)
				.json({ success: false, message: 'Category already exists' });
		}

		const newCategory = new CategorySchema({
			name: name.trim(),
			description: description,
			status: status,
		});

		await newCategory.save();

		res
			.status(200)
			.json({ success: true, message: 'Category added successfully' });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'An error occurred while adding the category',
		});
	}
};


// Get single category
const getCategory = async (req, res) => {
    try {
		
        const category = await CategorySchema.findById(req.params.id);
		
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
		const { id,name,description,status } = req.body
		const category = await CategorySchema.updateOne({_id: id}, {$set: {name: name,description: description,status: status}})
		
		if (!category) {
            return res.status(404).json({ success: false, message: 'Category not able to updated' });
        }else{
			return res.status(200).json({ success: true, message: 'Category updated successfully' });
		}


    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};



module.exports = {
	renderCategoryPage,
	addCategory,
	categoryCheck,
	getCategory,
	updateCategory,
	
};
