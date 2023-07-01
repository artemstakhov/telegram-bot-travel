const mongoose = require('mongoose');
require('dotenv').config();

mongoose
	.connect(process.env.dbLink, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('DB connected'))
	.catch((err) => console.log('DB error', err));
