/* eslint-env node */
const TelegramBot = require('node-telegram-bot-api');
const botCommands = require('./src/service/bot.service');
require('./src/db');
require('./src/app');
require('dotenv').config();

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

botCommands(bot);

console.log('Index.js executed');
