const express = require('express');
const cors = require('cors');
const adminRouter = require('./router/admin.router');
const config = require('../config');
const { logInfoBot, expressErrorLogger } = require('./adapter/pino.adapter');
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

// eslint-disable-next-line
app.use((err, req, res, next) => {
	expressErrorLogger(err);
	res.status(500).json({ error: 'Something went wrong' });
});
app.listen(currentConfig.port, () => {
	logInfoBot(`Server running on PORT ${currentConfig.port}`);
});
