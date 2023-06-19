const User = require("../schemas/User");

// Sends a message indicating that the user is already authorized.
async function sendAlreadyAuthorizedMessage(chatId, bot) {
  bot.sendMessage(chatId, 'You are already authorized.');
}

// Sends an authorization request to the user.
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

// Sends a location request to the user.
async function sendLocationRequest(chatId, bot) {
  const options = {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Send location',
            request_location: true,
          },
        ],
      ],
      resize_keyboard: true,
    },
  };
  setTimeout(() => {
    bot.sendMessage(chatId, 'Please send your location.', options);
  }, 100);
}

// Handles the "/start" command.
async function handleStartCommand(msg, bot) {
  const chatId = msg.chat.id;

  // Find an existing user based on the telegramId from the incoming message.
  const existingUser = await User.findOne({ telegramId: msg.from.id });

  if (existingUser?.isAuthorized) {
    // If the user is already authorized, check the time since their last authorization.
    const currentTime = Date.now();
    const timeSinceLastAuthorization = currentTime - existingUser.lastAuthorizationDate;
    const maxAuthorizationDuration = 60 * 60 * 1000; // 1 hour

    if (timeSinceLastAuthorization >= maxAuthorizationDuration) {
      // If the time since last authorization exceeds the maximum duration, send an authorization request.
      sendAuthorizationRequest(chatId, bot);
    } else {
      // If the user is authorized and within the maximum duration, send a message indicating they are already authorized.
      sendAlreadyAuthorizedMessage(chatId, bot);
    }
  } else {
    // If the user is not authorized, send an authorization request.
    sendAuthorizationRequest(chatId, bot);
  }

  // Request the user's location.
  sendLocationRequest(chatId, bot); // Move this line here
}

// Handles the contact message sent by the user during the authorization process.
async function handleContactMessage(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const existingUser = await User.findOne({ telegramId: userId });

  if (existingUser) {
    // If the user already exists in the database, update their authorization information.
    existingUser.isAuthorized = true;
    existingUser.firstName = msg.from.first_name;
    existingUser.phone = msg.contact.phone_number;
    existingUser.lastAuthorizationDate = Date.now(); // Save the current date and time of authorization

    try {
      await existingUser.save();
      bot.sendMessage(chatId, 'You are successfully authorized!', { reply_markup: { remove_keyboard: true } });
    } catch (err) {
      console.error('Error with saving user', err);
      bot.sendMessage(chatId, 'Error, try later.');
    }
  } else {
    // If the user does not exist in the database, create a new user with authorization information.
    const newUser = new User({
      telegramId: userId,
      username: msg.from.username,
      firstName: msg.from.first_name,
      phone: msg.contact.phone_number,
      isAuthorized: true,
      lastAuthorizationDate: Date.now(),
      location: {
        latitude: 0,
        longitude: 0
      } // Save the current date and time of authorization
    });

    try {
      await newUser.save();
      bot.sendMessage(chatId, 'You are successfully authorized!', { reply_markup: { remove_keyboard: true } });
    } catch (err) {
      console.error('Error with saving user', err);
      bot.sendMessage(chatId, 'Error, try later.');
    }
  }

  // Request the user's location.
  sendLocationRequest(chatId, bot); // Move this line here
}


// Handles the "/stop" command to deauthorize the user.
async function handleStopCommand(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const existingUser = await User.findOne({ telegramId: userId });

  if (existingUser) {
    // Deauthorize the user by setting the isAuthorized flag to false.
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
    // If the user is not found, handle it as if it's a new user and show the authorization request.
    bot.sendMessage(chatId, 'User not found.').then(() => {
      handleStartCommand(msg, bot);
    });
  }
}

// Handles the location message sent by the user.
async function handleLocationMessage(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const { latitude, longitude } = msg.location;

  const existingUser = await User.findOne({ telegramId: userId });

  if (existingUser) {
    // If the user is found, update their location information.
    if (existingUser.location) {
      existingUser.location.latitude = latitude;
      existingUser.location.longitude = longitude;
    } else {
      existingUser.location = {
        latitude: latitude,
        longitude: longitude,
      };
    }

    try {
      await existingUser.save();
      bot.sendMessage(chatId, 'Location saved successfully.', { reply_markup: { remove_keyboard: true } });
    } catch (err) {
      console.error('Error with saving user location', err);
      bot.sendMessage(chatId, 'Error saving location, try later.');
    }
  } else {
    // If the user is not found, handle it as if it's a new user and show the authorization request.
    bot.sendMessage(chatId, 'User not found.').then(() => {
      handleStartCommand(msg, bot);
    });
  }
}


// Checks the authorization status of users and deauthorizes inactive users.
async function checkAuthorizationStatus(bot) {
  const users = await User.find();

  users.forEach(async (user) => {
    if (user.isAuthorized && user.lastAuthorizationDate) {
      // Calculate the time since the last authorization
      const currentTime = Date.now();
      const timeSinceLastAuthorization = currentTime - user.lastAuthorizationDate;
      const maxAuthorizationDuration = 60 * 60 * 1000; // 1 hour

      if (timeSinceLastAuthorization >= maxAuthorizationDuration) {
        // If the user has exceeded the maximum authorization duration, deauthorize them.
        user.isAuthorized = false;
        try {
          await user.save();
          bot.sendMessage(user.telegramId, 'You have been automatically logged out due to inactivity.', {
            disable_notification: true
          });
        } catch (err) {
          console.error('Error with saving user', err);
        }
      }
    }
  });
}


module.exports = {
  handleStartCommand,
  handleContactMessage,
  handleStopCommand,
  handleLocationMessage,
  checkAuthorizationStatus,
};
