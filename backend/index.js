
const mongoose = require("mongoose");
const TelegramBot = require('node-telegram-bot-api');
const {handleStopCommand, handleStartCommand, handleContactMessage, checkAuthorizationStatus } = require("./controllers/UserController");
const User = require("./schemas/User");

const _token = '6065218921:AAGmb6DqIRuCuQqJ7FsHz_53ar6wwGSifb4';

const bot = new TelegramBot(_token, { polling: true });

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

bot.on('contact', (msg) => {
  handleContactMessage(msg, bot);
});

bot.onText(/\/stop/, (msg) => {
  handleStopCommand(msg, bot);
});
// Check authorization status every hour
setInterval(() => {
  checkAuthorizationStatus(bot);
}, 60 * 60 * 1000);

console.log('Bot has been started');