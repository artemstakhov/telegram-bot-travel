// Обработчики команд бота
const {
	handleLocationMessage,
	handleStopCommand,
	handleStartCommand,
	handleContactMessage,
	checkAuthorizationStatus,
	checkBanStatus,
} = require('../controllers/user.controller');
const {
	handleAddPlaceCommand,
	handleFindPlaceCommand,
} = require('../controllers/place.controller');
const { handleOptionalButtons } = require('../service/place.service');
const { logInfoBot, botErrorLogger } = require('../adapter/pino.adapter');
const User = require('../schemas/User');
module.exports = function (bot) {
	const myCommands = [
		{ command: '/start', description: 'start your conversation' },
		{ command: '/stop', description: 'logout' },
		{ command: '/places', description: 'add or find place' },
	];

	bot.setMyCommands(myCommands);

	bot.on('message', (msg) => {
		checkBanStatus(bot, msg);
	});

	bot.onText(/\/start/, (msg) => {
		handleStartCommand(msg, bot);
	});

	bot.on('contact', (msg) => {
		handleContactMessage(msg, bot);
	});

	let isButtonsShown = false;

	bot.on('location', (msg) => {
		handleLocationMessage(msg, bot)
			.then(async () => {
				const user = await User.findOne({ telegramId: msg.from.id }).lean();
				if (!isButtonsShown && !user.isAuthorized) {
					setTimeout(() => {
						handleOptionalButtons(msg.chat.id, bot);
					}, 100);
					isButtonsShown = true;
				}
			})
			.catch((error) => {
				botErrorLogger('Error handling location message', error);
			});
	});

	bot.onText(/\/places/, (msg) => {
		handleOptionalButtons(msg.chat.id, bot);
	});

	bot.on('callback_query', async (query) => {
		const chatId = query.message.chat.id;
		const messageId = query.message.message_id;
		const data = query.data;

		if (data.startsWith('prevPage:')) {
			const page = parseInt(data.split(':')[1]);
			handleFindPlaceCommand(chatId, bot, page, messageId);
		}
		if (data.startsWith('nextPage:')) {
			const page = parseInt(data.split(':')[1]);
			handleFindPlaceCommand(chatId, bot, page, messageId);
		}
	});

	//call back for add place and find place
	bot.on('callback_query', (msg) => {
		const data = msg.data;
		const chatId = msg.from.id;
		const userId = msg.from.id; // Use the correct field to get the user_id value

		if (data === 'add_place_button') {
			handleAddPlaceCommand(chatId, bot, userId); // Pass userId to the handleAddPlaceCommand function
			// Get the message identifier
			const messageId = msg.message.message_id;

			// Remove only the "Add Place" button from the message
			bot.editMessageReplyMarkup(
				{ inline_keyboard: [[]] }, // Empty array of buttons
				{ chat_id: chatId, message_id: messageId },
			);
		}

		if (data === 'find_place_button') {
			handleFindPlaceCommand(chatId, bot);

			// Get the message identifier
			const messageId = msg.message.message_id;

			// Remove only the "Find Place" button from the message
			bot.editMessageReplyMarkup(
				{ inline_keyboard: [[]] }, // Empty array of buttons
				{ chat_id: chatId, message_id: messageId },
			);
		}

		if (data === 'admin') {
			// Open localhost:3000/ in the browser
			const url = 'http://localhost:3000/';
			bot.sendMessage(chatId, `Opening ${url} in the browser...`);

			// You can use the 'opn' package to open the URL in the browser
			const opn = require('opn');
			opn(url);
		}
	});

	bot.onText(/\/stop/, (msg) => {
		handleStopCommand(msg, bot);
	});
	// Check authorization status every hour
	setInterval(() => {
		checkAuthorizationStatus(bot);
	}, 60 * 60 * 1000);

	logInfoBot('Bot has been started');
};
