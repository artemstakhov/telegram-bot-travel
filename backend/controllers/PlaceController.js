const Place = require("../schemas/Place");
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { sendAuthorizationRequest } = require("../controllers/UserController");
const User = require("../schemas/User");
const distance = require('google-distance-matrix');
require('dotenv').config();

let isAdded = false;

//Handles optional button actions based on user authorization status.
async function handleOptionalButtons(chatId, bot) {
  const user = await User.findOne({ telegramId: chatId });

  if (!user || !user.isAuthorized) {
    // if user !auth start auth
    return sendAuthorizationRequest(chatId, bot);
  }

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

  return !isAdded && await bot.sendMessage(chatId, 'Please select an option:', options);

  const messageId = sentMessage.message_id;

}

//Sends a request for the user to send their location.
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
        }, 1000)

      });
    });
}

//Sends a request for the user to enter the name of a place.
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

// Sends a request for the user to enter the description of a place.
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

// Sends a request for the user to enter the rating of a place.
async function sendPlaceRating(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please enter the rating of the place (from 1 to 5):')
    .then(() => {
      bot.once('text', (msg) => {
        const rating = parseInt(msg.text); // Parse the rating value as an integer
        if (isNaN(rating) || rating < 1 || rating > 5) {
          bot.sendMessage(chatId, 'Invalid rating. Please enter a number from 1 to 5.'); // If the rating is not a valid number from 1 to 5, send an error message
          sendPlaceRating(chatId, bot, place); // Prompt the user to enter a valid rating again
        } else {
          if (!Array.isArray(place.all_rating)) {
            place.all_rating = [];
          }
          place.all_rating.push(rating); // Add the rating to the array of all ratings for the place
          sendPhotoRequest(chatId, bot, place); // Proceed to request photos for the place
        }
      });
    });
}


// Sends a request for the user to send one or more photos of a place.
async function sendPhotoRequest(chatId, bot, place) {
  bot.sendMessage(chatId, 'Please send one or more photos of the place:');

  const messageHandler = async (msg) => {
    if (msg.photo) {
      const fileId = msg.photo[msg.photo.length - 1].file_id; // Retrieve the file ID of the received photo

      // Get information about the photo using its file ID
      const fileInfo = await bot.getFile(fileId);

      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;

      // Generate a unique file name for saving the photo
      const fileName = `${Date.now()}_${fileId}.jpg`;

      // Path to the folder for saving photos
      const photosFolderPath = path.join(__dirname, '../photos');

      // Create the folder if it doesn't exist
      if (!fs.existsSync(photosFolderPath)) {
        fs.mkdirSync(photosFolderPath);
      }

      const filePath = path.join(photosFolderPath, fileName);

      // Download the photo
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
      });

      response.data.pipe(fs.createWriteStream(filePath));

      // Add the file path to the place.photos[] array
      place.photos = place.photos || [];
      place.photos.push(filePath);

      // Continue to expect the next photo to be sent
      bot.sendMessage(chatId, 'Photo received! Please send the next one, or send any other message to finish.');
    } else {
      // If a message that is not a photo is received, call the savePlace method
      savePlace(chatId, bot, place);

      // Turn off the message event handler
      bot.off('message', messageHandler);
    }
  };

  // Expect the delivery of photos or messages that are not photos
  bot.on('message', messageHandler);
}


// Saves the place information to the database.
async function savePlace(chatId, bot, place) {
  isAdded = false;
  let newPlace = new Place(place); // Create a new instance of the Place model with the provided place information
  try {
    const sum = place.all_rating.reduce((total, rating) => total + rating, 0); // Calculate the sum of all ratings
    const averageRating = sum / place.all_rating.length; // Calculate the average rating
    newPlace.rating = averageRating; // Set the average rating for the new place
    await newPlace.save(); // Save the new place to the database
    place = {}; // Reset the place object
    newPlace = {}; // Reset the newPlace object
    bot.sendMessage(chatId, 'Place added successfully!', {
      reply_markup: {
        remove_keyboard: true,
      },
    }); // Send a success message to the user, and remove the keyboard

    // Clear saved data
  } catch (err) {
    console.error('Error saving place', err); // Log the error message if saving the place fails
    bot.sendMessage(chatId, 'Error saving place. Please try again later.'); // Send an error message to the user
  }
}


//Handles the "add place" command initiated by the user.
async function handleAddPlaceCommand(chatId, bot, userId) {
  isAdded = true;
  const place = {
    user_id: userId, // Сохраняем Telegram ID пользователя в поле user_id
  };
  sendPlaceLocation(chatId, bot, place);
}

distance.key(process.env.GOOGLE_MAPS_API_KEY);

// Function to calculate the distance between two points
async function calculateDistance(origin, destination) {
  return new Promise((resolve, reject) => {
    distance.mode('driving');

    const origins = [`${origin.latitude},${origin.longitude}`];
    const destinations = [`${destination.latitude},${destination.longitude}`];

    // Use the Google Distance Matrix API to calculate the distance
    distance.matrix(origins, destinations, (err, distances) => {
      if (err) {
        reject(err);
      } else if (!distances || distances.status !== 'OK') {
        reject(new Error('Unable to calculate distance.'));
      } else {
        const distanceResult = distances.rows[0].elements[0].distance;
        const km = Math.floor(distanceResult.value / 1000);
        const m = distanceResult.value % 1000;

        resolve({ km, m });
      }
    });
  });
}

const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_MAPS_API_KEY
});

// Function to get tourist places near a location
function getTouristPlaces(location) {
  return new Promise((resolve, reject) => {
    const places = []; // Array to store tourist places

    googleMapsClient.placesNearby({
      location: [location.latitude, location.longitude],
      radius: 200000, // Search radius in meters (200 km = 200000 m)
      type: 'tourist_attraction', // Type of places to search (tourist attractions)
      language: 'UA', // Language of the results
      rankby: 'prominence' // Sort the results by prominence
    }, (error, response) => {
      if (error) {
        console.error('Error with Places API', error);
        reject(error);
      } else {
        response.json.results.forEach(place => {
          const name = place.name;
          const rating = place.rating || 'No rating';
          const latitude = place.geometry.location.lat;
          const longitude = place.geometry.location.lng;

          // Create a place object with name, location, and rating
          const placeObj = {
            name: name,
            location: {
              latitude: latitude,
              longitude: longitude
            },
            rating: rating
          };

          places.push(placeObj);
        });

        resolve(places);
      }
    });
  });
}

async function handleFindPlaceCommand(chatId, bot, page = 1, messageId = null) {
  try {
    // Show a "Loading..." message while fetching and processing data
    const loadingMessage = await bot.sendMessage(chatId, 'Loading...');

    // Delayed deletion of the loading message after 4 seconds
    setTimeout(() => {
      bot.deleteMessage(chatId, loadingMessage.message_id);
    }, 4000);

    const user = await User.findOne({ telegramId: chatId });
    if (!user || !user.isAuthorized) {
      return sendAuthorizationRequest(chatId, bot);
    }

    const userLocation = user.location;
    const placesFromDB = await Place.find({});
    const touristPlaces = await getTouristPlaces(userLocation);

    const places = [...placesFromDB, ...touristPlaces];

    // Calculate distances between user's location and places
    const distances = [];
    for (const place of places) {
      const placeLocation = place.location;
      const distanceResult = await calculateDistance(userLocation, placeLocation);
      const km = distanceResult.km;
      const m = distanceResult.m;

      // Exclude places that are more than 200 km away
      if (km > 200) {
        continue;
      }

      const rating = place.rating || 'No rating yet';
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${placeLocation.latitude},${placeLocation.longitude}`;

      const formattedDistance = {
        name: place.name,
        km: km,
        m: m,
        rating: rating,
        latitude: placeLocation.latitude,
        longitude: placeLocation.longitude,
        mapUrl: mapUrl
      };

      distances.push(formattedDistance);
    }

    // Sort distances based on the calculated distance
    distances.sort((a, b) => {
      const distanceA = a.km * 1000 + a.m;
      const distanceB = b.km * 1000 + b.m;
      return distanceA - distanceB;
    });

    const itemsPerPage = 5;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDistances = distances.slice(startIndex, endIndex);

    // Format the distances into a readable message
    const formattedDistances = paginatedDistances.map(distance => {
      const { name, km, m, rating, latitude, longitude, mapUrl } = distance;
      return `${name} - ${km} km ${m} m. Rating: ${rating} [Google Maps](${mapUrl})\n`;
    });

    const totalPages = Math.ceil(distances.length / itemsPerPage);
    const currentPage = page;

    let message = formattedDistances.join('\n\n');
    message += `\n\nPage ${currentPage} of ${totalPages}`;

    const keyboard = [];
    if (currentPage > 1) {
      keyboard.push({ text: 'Previous', callback_data: `prevPage:${currentPage - 1}` });
    }
    if (currentPage < totalPages) {
      keyboard.push({ text: 'Next', callback_data: `nextPage:${currentPage + 1}` });
    }

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [keyboard]
      }
    };

    if (messageId) {
      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        ...options
      });
    } else {
      bot.sendMessage(chatId, message, options)
        .then(sentMessage => {
          const newMessageId = sentMessage.message_id;
          // Save the ID of the new message for future updates
          user.lastMessageId = newMessageId;
          user.save();
        });
    }
  } catch (error) {
    console.error('Error handling find place command:', error);
  }
}

module.exports = {
  handleAddPlaceCommand,
  handleFindPlaceCommand,
  handleOptionalButtons,
};