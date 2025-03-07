const adminSchema = require('../../model/userModel');



const getUserList = async (req, res) => {
    try {
        let userList = await adminSchema.find({ is_admin: false });
        res.render('userList', { userList });
    } catch (error) {
        res
            .status(500)
            .json({ error: 'Internal Server Error', message: error.message });
    }
};

const blockUser = async (req, res) => {
    try {
        const { id } = req.body; // Extract the user ID from the request body

        let userBlock = await adminSchema.findById(id); // Find the user by ID using the adminSchema
        
        if (!userBlock) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's is_block status
        userBlock.is_block = true;
        await userBlock.save(); // Save the updated user
        res
            .status(200)
            .json({ message: 'User blocked successfully', user: userBlock });
    } catch (error) {
        res
            .status(500)
            .json({ message: 'An error occurred while blocking the user' });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { id } = req.body;

        let userUnblock = await adminSchema.findById(id); // Find the user by ID using the adminSchema

        if (!userUnblock) {
            return res.status(404).json({ message: 'User not found' });
        }

        userUnblock.is_block = false;
        await userUnblock.save();
        res
            .status(200)
            .json({ message: 'User unblocked successfully', user: userUnblock });
    } catch (error) {
        res
            .status(500)
            .json({ message: 'An error occurred while unblocking the user' });
    }
};











module.exports = {
	getUserList,
	blockUser,
	unblockUser
};