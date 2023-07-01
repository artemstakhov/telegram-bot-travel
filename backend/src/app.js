const express = require('express');
const cors = require('cors');
const adminRouter = require('./router/admin.router');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(
	cors({
		credentials: true,
		origin: ['http://localhost:3000'],
	}),
);
app.use(express.json());

app.use('/admin', adminRouter);

app.listen(PORT, () => {
	console.log(`Server running on PORT ${PORT}`);
});
