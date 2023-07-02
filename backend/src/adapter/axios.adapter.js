const axios = require('axios');

// Create an instance of axios with the desired configuration
const axiosInstance = axios.create({
	// Add your desired configuration options here
	// For example:
	baseURL: 'https://api.example.com',
	timeout: 5000,
});

axiosInstance.getWithAdapter = async (url, config) => {
	// Вызовите метод get в экземпляре axios с переданными параметрами
	const response = await axiosInstance.get(url, config);
	return response;
};

// Export the axios instance
module.exports = axiosInstance;
