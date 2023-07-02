const pino = require('pino');
const fs = require('fs');
const botLogFile = './src/logs/bot.log';
const appLogFile = './src/logs/app.log';
const oldBotLogFile = './src/logs/old.bot.log';
const oldAppLogFile = './src/logs/old.app.log';

// Check if old log files exist
const isOldBotLogFileExists = fs.existsSync(oldBotLogFile);
const isOldAppLogFileExists = fs.existsSync(oldAppLogFile);

// Move current logs to old log files
if (fs.existsSync(botLogFile)) {
	const botLogContent = fs.readFileSync(botLogFile, 'utf8');
	if (isOldBotLogFileExists) {
		fs.appendFileSync(oldBotLogFile, botLogContent);
	} else {
		fs.writeFileSync(oldBotLogFile, botLogContent);
	}
	fs.unlinkSync(botLogFile);
}

if (fs.existsSync(appLogFile)) {
	const appLogContent = fs.readFileSync(appLogFile, 'utf8');
	if (isOldAppLogFileExists) {
		fs.appendFileSync(oldAppLogFile, appLogContent);
	} else {
		fs.writeFileSync(oldAppLogFile, appLogContent);
	}
	fs.unlinkSync(appLogFile);
}

// Initialize new log files
const botLogger = pino(
	{
		name: 'bot',
		level: 'info',
		prettyPrint: false,
		base: null,
	},
	pino.destination(botLogFile),
);

const appLogger = pino(
	{
		name: 'app',
		level: 'info',
		prettyPrint: false,
		base: null,
	},
	pino.destination(appLogFile),
);

function logInfoBot(message) {
	botLogger.info(message);
}

function logInfoApp(message) {
	appLogger.info(message);
}

function expressErrorLogger(err) {
	appLogger.error('Error Express:' + err);
}

function botErrorLogger(error) {
	botLogger.error('Error bot:', error);
}

module.exports = {
	expressErrorLogger,
	botErrorLogger,
	logInfoBot,
	logInfoApp,
};
