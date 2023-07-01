const userService = require('../service/user.service');

async function handleStartCommand(msg, bot) {
	await userService.handleStartCommand(msg, bot);
}

async function handleContactMessage(msg, bot) {
	await userService.handleContactMessage(msg, bot);
}

async function handleStopCommand(msg, bot) {
	await userService.handleStopCommand(msg, bot);
}

async function handleLocationMessage(msg, bot) {
	await userService.handleLocationMessage(msg, bot);
}

async function checkAuthorizationStatus(bot) {
	await userService.checkAuthorizationStatus(bot);
}

async function checkBanStatus(bot, msg) {
	await userService.checkBanStatus(bot, msg);
}

module.exports = {
	handleStartCommand,
	handleContactMessage,
	handleStopCommand,
	handleLocationMessage,
	checkAuthorizationStatus,
	checkBanStatus,
};
