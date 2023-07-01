const express = require('express');
const cors = require('cors');
const adminRouter = require('./router/admin.router');
const config = require('../config');

const app = express();
const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

app.use(
	cors({
		credentials: true,
		origin: currentConfig.corsOrigin,
	}),
);
app.use(express.json());

app.use('/admin', adminRouter);

app.listen(currentConfig.port, () => {
	console.log(`Server running on PORT ${currentConfig.port}`);
});
