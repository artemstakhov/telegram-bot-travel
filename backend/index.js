const TelegramBot = require('node-telegram-bot-api');
const botCommands = require('./src/service/bot.service');
const config = require('./config');
require('./src/db');
require('./src/app');

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

const bot = new TelegramBot(currentConfig.telegramToken, { polling: true });

botCommands(bot);
