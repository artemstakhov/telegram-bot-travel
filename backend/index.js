const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
const TelegramBot = require('node-telegram-bot-api');
const {handleLocationMessage, handleStopCommand, handleStartCommand, handleContactMessage, checkAuthorizationStatus } = require("./controllers/UserController");
const {handleOptionalButtons, handleAddPlaceCommand, handleFindPlaceCommand, handleCancel} = require("./controllers/PlaceController")
const User = require("./schemas/User");
const Place = require("./schemas/Place");

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
      { chat_id: chatId, message_id: messageId }
    );
  } else if (data === 'find_place_button') {
    handleFindPlaceCommand(chatId, bot);

    // Get the message identifier
    const messageId = msg.message.message_id;

    // Remove only the "Find Place" button from the message
    bot.editMessageReplyMarkup(
      { inline_keyboard: [[]] }, // Empty array of buttons
      { chat_id: chatId, message_id: messageId }
    );
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