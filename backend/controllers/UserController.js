const User = require("../schemas/User");

async function sendAlreadyAuthorizedMessage(chatId, bot) {
  bot.sendMessage(chatId, 'You are already authorized.');
}

async function handleStartCommand(msg, bot) {
  const chatId = msg.chat.id;

  const existingUser = await User.findOne({ telegramId: msg.from.id });

  if (existingUser) {
    if (existingUser.isAuthorized) {
      sendAlreadyAuthorizedMessage(chatId, bot);
    } else {
      const button = {
        text: 'Authorize',
        callback_data: 'authorize_user',
      };

      const keyboard = {
        inline_keyboard: [[button]],
      };

      const options = {
        reply_markup: JSON.stringify(keyboard),
      };

      bot.sendMessage(chatId, 'You are not authorized. Click the button to authorize.', options);
    }
  } else {
    bot.sendMessage(chatId, 'Say your name').then(() => {
      // Set up a listener for the user's name
      bot.onText(/^(.*)$/, async (msg, match) => {
        const name = match[1];
        const newUser = new User({
          telegramId: msg.from.id,
          username: msg.from.username,
          firstName: name,
          isAuthorized: true,
        });

        try {
          await newUser.save();
          bot.sendMessage(chatId, 'You are successfully registered and authorized!');
        } catch (err) {
          console.error('Error with saving user', err);
          bot.sendMessage(chatId, 'Error, try later.');
        }

        // Remove the listener after handling the name
        bot.removeTextListener(/^(.*)$/);
      });
    });
  }
}

async function handleAuthorizeCallback(query, bot) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  const existingUser = await User.findOne({ telegramId: userId });

  if (existingUser) {
    existingUser.isAuthorized = true;
    try {
      await existingUser.save();
      bot.sendMessage(chatId, 'You are successfully authorized!');
    } catch (err) {
      console.error('Error with saving user', err);
      bot.sendMessage(chatId, 'Error, try later.');
    }
  } else {
    bot.sendMessage(chatId, 'User not found.');
  }
}

module.exports = {handleStartCommand, handleAuthorizeCallback };
