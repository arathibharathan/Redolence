const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();
const nocahe = require('nocache');
const passport = require('./passport');
const methodOverride = require('method-override');
const flash = require('connect-flash');



app.use(express.json()); // For JSON data converting
app.use(express.urlencoded({ extended: true })); // For URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const path = require('path');
const mongoose = require('mongoose');

// ----- Code to connect mongodb -----
const link = process.env.MONGO_ID;
mongoose
	.connect(link)
	.then(() => {
		console.log('MongoDB Connected');
	})
	.catch((err) => {
		console.error('Connection error', err);
	});
const userRouter = require('./router/userRouter');
const adminRouter = require('./router/adminRouter');

app.set('view engine', 'ejs');
app.set('views', './views/user');
app.use(nocahe());
// Session setup
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);



app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use(methodOverride('_method')); // Allow using _method query parameter to override HTTP methods

app.use(flash());// Initialize flash middleware

app.listen(3000, () => {
	console.log(`http://localhost:3000`);
});
