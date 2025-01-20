
const getdashBoard = async (req, res) => {
	try {
		res.render('dashboard');
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Internal Server Error', message: error.message });
	}
};








module.exports = {
	getdashBoard
};