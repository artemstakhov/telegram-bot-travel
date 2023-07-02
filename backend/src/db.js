const mongoose = require('mongoose');
const config = require('../config');
const { logInfoApp } = require('./adapter/pino.adapter');

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

mongoose
	.connect(currentConfig.dbLink, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => logInfoApp('DB connected'))
	.catch((err) => logInfoApp('DB error', err));
