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
          sendPlaceName(chatId, bot, place);
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
          if (!Array.isArray(place.all_rating)) {
            place.all_rating = [];
          }
          place.all_rating.push(rating);
          sendPhotoRequest(chatId, bot, place);
        }
      });
    });
}

async function sendPhotoRequest(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please send one or more photos of the place:');

  const messageHandler = async (msg) => {
    if (msg.photo) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;

      // Получаем информацию о фотографии по её file_id
      const fileInfo = await bot.getFile(fileId);

      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;

      // Генерируем уникальное имя файла для сохранения
      const fileName = `${Date.now()}_${fileId}.jpg`;

      // Путь к папке для сохранения фотографий
      const photosFolderPath = path.join(__dirname, '../photos');

      // Создаем папку, если она не существует
      if (!fs.existsSync(photosFolderPath)) {
        fs.mkdirSync(photosFolderPath);
      }

      const filePath = path.join(photosFolderPath, fileName);

      // Скачиваем фотографию
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
      });

      response.data.pipe(fs.createWriteStream(filePath));

      // Добавляем путь к файлу в массив place.photos[]
      place.photos = place.photos || [];
      place.photos.push(filePath);

      // Продолжаем ожидать отправки следующей фотографии
      bot.sendMessage(chatId, 'Photo received! Please send the next one, or send any other message to finish.');
    } else {
      // Если получено сообщение, не являющееся фотографией, вызываем метод savePlace
      savePlace(chatId, bot, place);

      // Отключаем обработчик события message
      bot.off('message', messageHandler);
    }
  };

  // Ожидаем отправку фотографий или сообщения, не являющегося фотографией
  bot.on('message', messageHandler);
}




async function savePlace(chatId, bot, place) {
  console.log('save');
  let newPlace = new Place(place);
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
  handleOptionalButtons,
};
