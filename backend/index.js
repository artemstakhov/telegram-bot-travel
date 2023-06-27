/* eslint-env node */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const adminRouter = require('./router/AdminRouter');
const {
	handleLocationMessage,
	handleStopCommand,
	handleStartCommand,
	handleContactMessage,
	checkAuthorizationStatus,
} = require('./controllers/UserController');
const {
	handleOptionalButtons,
	handleAddPlaceCommand,
	handleFindPlaceCommand,
} = require('./controllers/PlaceController');
require('dotenv').config();

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

mongoose
	.connect(process.env.dbLink, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('DB connected'))
	.catch((err) => console.log('DB error', err));

const myCommands = [
	{ command: '/start', description: 'start your conversation' },
	{ command: '/stop', description: 'logout' },
	{ command: '/places', description: 'add or find place' },
];

bot.setMyCommands(myCommands);

bot.onText(/\/start/, (msg) => {
	handleStartCommand(msg, bot);
});

bot.on('contact', (msg) => {
	handleContactMessage(msg, bot);
});

let isButtonsShown = false;

bot.on('location', (msg) => {
	handleLocationMessage(msg, bot)
		.then(() => {
			if (!isButtonsShown) {
				setTimeout(() => {
					handleOptionalButtons(msg.chat.id, bot);
				}, 100);
				isButtonsShown = true;
			}
		})
		.catch((error) => {
			console.error('Error handling location message', error);
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
	} else if (data.startsWith('nextPage:')) {
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

console.log('Bot has been started');

//API
const app = express();
const PORT = process.env.PORT || 3002;
app.use(
	cors({
		credentials: true,
		origin: [
			'http://localhost:3000',
		],
	})
);
app.use(express.json());

app.use('/places', adminRouter);
app.listen(PORT, () => {
	console.log(`server runing on PORT ${PORT}`);
});