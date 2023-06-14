const User = require("../schemas/User");

async function sendAlreadyAuthorizedMessage(chatId, bot) {
  bot.sendMessage(chatId, 'You are already authorized.');
}

async function handleMessage(msg, bot) {
  const chatId = msg.chat.id;

  if (msg.text) {
    if (msg.text.startsWith('/start')) {
      await handleStartCommand(msg, bot);
      return;
    }

    const existingUser = await User.findOne({ telegramId: msg.from.id });

    if (existingUser) {
      if (existingUser.isAuthorized) {
        sendAlreadyAuthorizedMessage(chatId, bot);
        return;
      }
    } else {
      const newUser = new User({
        telegramId: msg.from.id,
        username: msg.from.username,
        firstName: msg.text,
        isAuthorized: true,
      });

      try {
        await newUser.save();
        bot.sendMessage(chatId, 'You are successfully registered and authorized!');
      } catch (err) {
        console.error('Error with saving user', err);
        bot.sendMessage(chatId, 'Error, try later.');
      }
    }
  }
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
    bot.sendMessage(chatId, 'Say your name');
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

module.exports = { handleMessage, handleStartCommand, handleAuthorizeCallback };
