
const mongoose = require("mongoose");
const TelegramBot = require('node-telegram-bot-api');
const { handleMessage, handleStartCommand, handleAuthorizeCallback } = require("./controllers/UserController");
const User = require("./schemas/User");

const token = '6065218921:AAGmb6DqIRuCuQqJ7FsHz_53ar6wwGSifb4'; // Установите свой токен

const bot = new TelegramBot(token, { polling: true });

mongoose
  .connect(
    "mongodb+srv://artyomstahov33:1029artyom@tg-bot.itzvp0e.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB error", err));

bot.onText(/\/start/, (msg) => {
  handleStartCommand(msg, bot);
});

bot.on('callback_query', (query) => {
  if (query.data === 'authorize_user') {
    handleAuthorizeCallback(query, bot);
  }
});

bot.on('message', (msg) => {
  if (!msg.text.startsWith('/start')) {
    handleMessage(msg, bot);
  }
});

console.log('Bot started');
