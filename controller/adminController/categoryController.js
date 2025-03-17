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
        let { name, description, status } = req.body;

        // Trim input values
        name = name?.trim();

        // Check for empty fields
        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        // Ensure case-insensitive uniqueness
        const existingCategory = await CategorySchema.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        // Create a new category
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


// Get single category for edit
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

// Update category, to show values in edit modal
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

//block and unblock
const blockCategory = async (req, res) => {
	try {
        const { categoryId } = req.body;
        const category = await CategorySchema.findById(categoryId);

        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        // Toggle status
        category.status = category.status === 'listed' ? 'unlisted' : 'listed';
        await category.save();

        res.json({ 
            success: true, 
            newStatus: category.status 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}


module.exports = {
	renderCategoryPage,
	addCategory,
	getCategory,
	updateCategory,
	blockCategory
};
