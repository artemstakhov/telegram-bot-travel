const Place = require("../schemas/Place");

async function handleOptionalButtons(chatId, bot) {
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Add Place',
            callback_data: 'add_place',
          },
          {
            text: 'Find Place',
            callback_data: 'find_place',
          },
        ],
      ]
    },
  };

  bot.sendMessage(chatId, 'Please select an option:', options);
}

async function sendPlaceLocation(chatId, bot, place) {
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
      one_time_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Please send your location. If you are not at the place, turn off GPS and manually choose the location.', options)
    .then(() => {
      bot.once('location', (msg) => {
        const { latitude, longitude } = msg.location;
        place.location = {
          latitude,
          longitude,
        };
        setTimeout(() =>{
            sendPlaceName(chatId, bot, place);
        },100)
        
      });
    });
}

async function sendPlaceName(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please enter the name of the place:')
    .then(() => {
      bot.once('text', (msg) => {
        const name = msg.text;
        place.name = name;
        sendPlaceDescription(chatId, bot, place);
      });
    });
}

async function sendPlaceDescription(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please enter the description of the place:')
    .then(() => {
      bot.once('text', (msg) => {
        const description = msg.text;
        place.description = description;
        sendPlaceRating(chatId, bot, place);
      });
    });
}

async function sendPlaceRating(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please enter the rating of the place (from 1 to 5):')
    .then(() => {
      bot.once('text', (msg) => {
        const rating = parseInt(msg.text);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          bot.sendMessage(chatId, 'Invalid rating. Please enter a number from 1 to 5.');
          sendPlaceRating(chatId, bot, place);
        } else {
          place.rating = rating;
          savePlace(chatId, bot, place);
        }
      });
    });
}

async function savePlace(chatId, bot, place) {
  const newPlace = new Place(place);

  try {
    await newPlace.save();
    bot.sendMessage(chatId, 'Place added successfully!');
  } catch (err) {
    console.error('Error saving place', err);
    bot.sendMessage(chatId, 'Error saving place. Please try again later.');
  }
}

async function handleAddPlaceCommand(chatId, bot) {
  const place = {};
  sendPlaceLocation(chatId, bot, place);
}

async function handleFindPlaceCommand(chatId, bot) {

}

module.exports = {
  handleAddPlaceCommand,
  handleFindPlaceCommand,
  handleOptionalButtons
};
