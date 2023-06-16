const Place = require("../schemas/Place");
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sendAuthorizationRequest = require("../controllers/UserController");
const User = require("../schemas/User");


const cloneDeep = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

async function handleOptionalButtons(chatId, bot) {
  const user = await User.findOne({ telegramId: chatId });

  if (!user || !user.isAuthorized) {
    // Если пользователь не авторизован, вызываем авторизацию
    sendAuthorizationRequest(chatId, bot);
  } else {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Add Place',
              callback_data: 'add_place_button',
            },
            {
              text: 'Find Place',
              callback_data: 'find_place_button',
            },
          ],
        ],
      },
    };

    const sentMessage = await bot.sendMessage(chatId, 'Please select an option:', options);

    const messageId = sentMessage.message_id;
  }
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
        setTimeout(() => {
          sendPlaceName(chatId, bot, cloneDeep(place));
        }, 100)

      });
    });
}

async function sendPlaceName(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please enter the name of the place:')
    .then(() => {
      bot.once('text', (msg) => {
        const name = msg.text;
        place.name = name;
        sendPlaceDescription(chatId, bot, cloneDeep(place));
      });
    });
}

async function sendPlaceDescription(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please enter the description of the place:')
    .then(() => {
      bot.once('text', (msg) => {
        const description = msg.text;
        place.description = description;
        sendPlaceRating(chatId, bot, cloneDeep(place));
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
          sendPlaceRating(chatId, bot, cloneDeep(place));
        } else {
          if (!Array.isArray(place.all_rating)) {
            place.all_rating = [];
          }
          place.all_rating.push(rating);
          sendPhotoRequest(chatId, bot, cloneDeep(place));
        }
      });
    });
}

async function downloadPhoto(url, destination) {
  const writer = fs.createWriteStream(destination);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

let photoHandlerAdded = false;
let sendPhotosHandlerAdded = false;


async function sendPhotoRequest(chatId, bot, place) {
  let newPlace = cloneDeep(place);

  newPlace.photos = [];
  bot.sendMessage(chatId, 'Please send up to 5 photos of the place. Send them one by one or click "Send Photos" when finished.')
    .then(() => {
      const options = {
        reply_markup: {
          keyboard: [
            [
              {
                text: 'Send Photos',
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      };
      bot.sendMessage(chatId, 'Send Photos', options);
      if (!photoHandlerAdded) {
        bot.on('photo', (msg) => {
          if (newPlace.photos.length >= 5) {
            // Если уже получено 5 фотографий, игнорируем остальные
            return;
          }

          const photoId = msg.photo[0].file_id;
          bot.getFile(photoId).then((file) => {
            const photoName = `${newPlace.name}_${newPlace.photos.length + 1}`; // Изменяем формат названия фотографий
            const photoPath = path.join(__dirname, '..', 'photos', `${photoName}.jpg`);
            const downloadUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

            downloadPhoto(downloadUrl, photoPath)
              .then(() => {
                newPlace.photos.push(photoPath);
                if (newPlace.photos.length >= 5) {
                  // Проверяем, есть ли уже обработчик sendPhotosHandler
                  if (sendPhotosHandlerAdded) {
                    savePlace(chatId, bot, cloneDeep(newPlace)); // Используем newPlace для сохранения
                  }
                }
              })
              .catch((error) => {
                console.error('Error downloading photo', error);
                bot.sendMessage(chatId, 'Error downloading photo. Please try again.');
              });
          });
        });
        photoHandlerAdded = true;
      }
      //норм
      if (!sendPhotosHandlerAdded) {
        console.log(place);
        //не норм
        bot.onText(/Send Photos/, (msg) => {
          if (newPlace.photos.length > 0) {

            if (photoHandlerAdded) { 
              
              savePlace(chatId, bot, cloneDeep(newPlace)); 
            }
          } else {
            bot.sendMessage(chatId, 'Please send at least one photo of the place.');
          }
        });
        sendPhotosHandlerAdded = true;
      }
    });
}




async function savePlace(chatId, bot, place) {
  console.log('save');
  let newPlace = new Place(cloneDeep(place));
  try {
    const sum = place.all_rating.reduce((total, rating) => total + rating, 0);
    const averageRating = sum / place.all_rating.length;
    newPlace.rating = averageRating; // avg rating
    await newPlace.save();
    place = {}; // Сбросить объект place
    newPlace = {};
    bot.sendMessage(chatId, 'Place added successfully!', {
      reply_markup: {
        remove_keyboard: true,
      },
    });

    // Очистить сохраненные данны
  } catch (err) {
    console.error('Error saving place', err);
    bot.sendMessage(chatId, 'Error saving place. Please try again later.');
  }
}



async function handleAddPlaceCommand(chatId, bot, userId) {
  const place = {
    user_id: userId, // Сохраняем Telegram ID пользователя в поле user_id
  };
  sendPlaceLocation(chatId, bot, place);
}

async function handleFindPlaceCommand(chatId, bot) {

}

module.exports = {
  handleAddPlaceCommand,
  handleFindPlaceCommand,
  handleOptionalButtons
};
