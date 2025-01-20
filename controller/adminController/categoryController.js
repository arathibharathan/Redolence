const Category = require('../../model/categoryModel');



const renderCategoryPage = async (req, res) => {
    try {
        const category = await Category.find({});
        res.render('category', { category });
    } catch (error) {
        res
            .status(500)
            .json({ error: 'Internal Server Error', message: error.message });
    }
};

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
        res
            .status(500)
            .json({
                success: false,
                message: 'Internal server error',
                error: error.message,
            });
    }
};

const categoryCheck = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        const existingCategory = await Category.findOne({ name: name });
        if (existingCategory) {
            return res
                .status(409)
                .json({ success: false, message: 'Category already exists' });
        }

        const newCategory = new Category({
            name: name.trim(),
            description: description,
            status: status,
        });

        await newCategory.save();

        res
            .status(200)
            .json({ success: true, message: 'Category added successfully' });
    } catch (error) {
        res
            .status(500)
            .json({
                success: false,
                message: 'An error occurred while adding the category',
            });
    }
};

const updateCategory = (req, res) => {
    try {
        console.log(req.body);
    } catch (error) {
        res
            .status(500)
            .json({ error: 'Internal Server Error', message: error.message });
    }
};

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
};

const editCategory = async (req, res) => {
    try {
        const { name, description, status, id } = req.body;

        const update = await Category.updateOne(
            { _id: id },
            { name: name, description: description, status: status }
        );

        res.json({ success: true });
    } catch (error) {}
};

const blockCategory = async (req, res) => {
	try {
		const category = await Category.findOne({ _id: req.query._id });
		if (category.status == 'unlisted') {
			await Category.updateOne({ _id: req.query._id }, { status: 'listed' });
		} else {
			await Category.updateOne({ _id: req.query._id }, { status: 'unlisted' });
		}
		res.json({ success: true });
	} catch (error) {
		console.log(error);
	}
};





module.exports = {
	renderCategoryPage,
	createCategory,
	categoryCheck,
	updateCategory,
	getCatForEdit,
	editCategory,
	blockCategory
};