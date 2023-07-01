/* eslint-env node */
const Place = require('../schemas/Place');
const User = require('../schemas/User');
const {
	sendPlaceLocation,
	paginationCallback,
	getTouristPlaces,
	checkUserAuth,
	paginateSortDistances,
	calculatingAllDistances,
} = require('../service/place.service');

async function handleAddPlaceCommand(chatId, bot, userId) {
	const place = {
		user_id: userId, // Сохраняем Telegram ID пользователя в поле user_id
	};
	sendPlaceLocation(chatId, bot, place);
}

async function handleFindPlaceCommand(chatId, bot, page = 1, messageId = null) {
	try {
		const loadingMessage = await bot.sendMessage(chatId, 'Loading...');

		setTimeout(async () => {
			await bot.deleteMessage(chatId, loadingMessage.message_id);
			const user = await User.findOne({ telegramId: chatId });

			await checkUserAuth(user, chatId, bot);

			const userLocation = user.location;
			const placesFromDB = await Place.find({});
			const touristPlaces = await getTouristPlaces(userLocation);

			const places = [...placesFromDB, ...touristPlaces];

			const distances = [];
			await calculatingAllDistances(places, userLocation, distances);
			await paginateSortDistances(
				distances,
				page,
				messageId,
				bot,
				chatId,
				user,
				placesFromDB,
			);
		}, 4000);
		await paginationCallback(bot);
	} catch (error) {
		console.error('Error handling find place command:', error);
	}
}

module.exports = {
	handleAddPlaceCommand,
	handleFindPlaceCommand,
};
