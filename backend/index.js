
const mongoose = require("mongoose");
const TelegramBot = require('node-telegram-bot-api');
const {handleStartCommand, handleAuthorizeCallback } = require("./controllers/UserController");
const User = require("./schemas/User");

const _token = '6065218921:AAGmb6DqIRuCuQqJ7FsHz_53ar6wwGSifb4'; // Установите свой токен

const bot = new TelegramBot(_token, { polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

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


console.log('Bot has been started');
