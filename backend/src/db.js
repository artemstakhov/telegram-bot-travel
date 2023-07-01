const mongoose = require('mongoose');
const config = require('../config');

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

mongoose
	.connect(currentConfig.dbLink, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('DB connected'))
	.catch((err) => console.log('DB error', err));
