const User = require("../schemas/User");

async function sendAlreadyAuthorizedMessage(chatId, bot) {
  bot.sendMessage(chatId, 'You are already authorized.');
}

async function sendAuthorizationRequest(chatId, bot) {
  const options = {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Authorize',
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'You are not authorized. Please authorize by sending your contact.', options);
}

async function handleStartCommand(msg, bot) {
  const chatId = msg.chat.id;

  const existingUser = await User.findOne({ telegramId: msg.from.id });

  if (existingUser?.isAuthorized) {
    const currentTime = Date.now();
    const timeSinceLastAuthorization = currentTime - existingUser.lastAuthorizationDate;
    const maxAuthorizationDuration = 60 * 60 * 1000; // 1 hour

    if (timeSinceLastAuthorization >= maxAuthorizationDuration) {
      sendAuthorizationRequest(chatId, bot);
    } else {
      sendAlreadyAuthorizedMessage(chatId, bot);
    }
  } else {
    sendAuthorizationRequest(chatId, bot);
  }
}

async function handleContactMessage(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const existingUser = await User.findOne({ telegramId: userId });

  if (existingUser) {
    existingUser.isAuthorized = true;
    existingUser.firstName = msg.from.first_name;
    existingUser.phone = msg.contact.phone_number;
    existingUser.lastAuthorizationDate = Date.now(); // Сохраняем текущую дату и время авторизации

    try {
      await existingUser.save();
      bot.sendMessage(chatId, 'You are successfully authorized!').then(() => {
        // Remove the custom keyboard after sending the message
        bot.sendMessage(chatId, 'Authorized!', { reply_markup: { remove_keyboard: true } });
      });
    } catch (err) {
      console.error('Error with saving user', err);
      bot.sendMessage(chatId, 'Error, try later.');
    }
  } else {
    const newUser = new User({
      telegramId: userId,
      username: msg.from.username,
      firstName: msg.from.first_name,
      phone: msg.contact.phone_number,
      isAuthorized: true,
      lastAuthorizationDate: Date.now(), // Сохраняем текущую дату и время авторизации
    });

    try {
      await newUser.save();
      bot.sendMessage(chatId, 'You are successfully authorized!').then(() => {
        // Remove the custom keyboard after sending the message
        bot.sendMessage(chatId, 'Authorized!', { reply_markup: { remove_keyboard: true } });
      });
    } catch (err) {
      console.error('Error with saving user', err);
      bot.sendMessage(chatId, 'Error, try later.');
    }
  }
}

async function handleStopCommand(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const existingUser = await User.findOne({ telegramId: userId });

  if (existingUser) {
    existingUser.isAuthorized = false;

    try {
      await existingUser.save();
      bot.sendMessage(chatId, 'You have been deauthorized.').then(() => {
        // Show the custom keyboard after sending the message
        sendAuthorizationRequest(chatId, bot);
      });
    } catch (err) {
      console.error('Error with saving user', err);
      bot.sendMessage(chatId, 'Error, try later.');
    }
  } else {
    bot.sendMessage(chatId, 'User not found.').then(() => {
      handleStartCommand(msg, bot);
    });
  }
}

async function checkAuthorizationStatus(bot) {
  const users = await User.find();

  users.forEach(async (user) => {
    if (user.isAuthorized && user.lastAuthorizationDate) {
      const currentTime = Date.now();
      const timeSinceLastAuthorization = currentTime - user.lastAuthorizationDate;
      const maxAuthorizationDuration = 60 * 60 * 1000; // 1 hour

      if (timeSinceLastAuthorization >= maxAuthorizationDuration) {
        user.isAuthorized = false;
        try {
          await user.save();
          bot.sendMessage(user.telegramId, 'You have been automatically logged out due to inactivity.');
        } catch (err) {
          console.error('Error with saving user', err);
        }
      }
    }
  });
}

module.exports = { handleStartCommand, handleContactMessage, handleStopCommand, checkAuthorizationStatus };
