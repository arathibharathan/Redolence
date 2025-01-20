const userSchema = require('../../model/userModel');


const home = async (req, res) => {
	try {
		if (req.session.user) {
			let User = await userSchema.find({ _id: req.session.user._id });
			res.render('home', { User });
		} else {
			let User = undefined;
			res.render('home', { User });
		}
	} catch (error) {
		console.log(error);
	}
};

module.exports = {
	home
};
