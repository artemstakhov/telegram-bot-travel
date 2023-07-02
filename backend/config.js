require('dotenv').config();

const config = {
	development: {
		environment: 'development',
		telegramToken: process.env.TOKEN,
		dbLink: process.env.dbLink,
		googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
		port: process.env.PORT || 3002,
		corsOrigin: ['http://localhost:3000'],
	},
	production: {
		environment: 'production',
		telegramToken: process.env.TOKEN,
		dbLink: process.env.dbLink,
		googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
		port: process.env.PORT || 3002,
		corsOrigin: ['http://example.com'], //prod
	},
};

module.exports = config;
