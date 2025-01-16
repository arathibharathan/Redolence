const isLogin = async (req, res, next) => {
	try {
		if (req.session.admin) {
			return next();
		} else {
			return res.redirect('/admin/login');
		}
	} catch (error) {
		console.log(error.message);
	}
};

const isLogout = async (req, res, next) => {
	try {
		if (req.session.admin) {
			return res.redirect('/admin/dashboard');
		} else {
			return next();
		}
	} catch (error) {
		console.log(error.message);
	}
};

module.exports = {
	isLogin,
	isLogout,
};
