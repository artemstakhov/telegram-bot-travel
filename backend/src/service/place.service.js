const Place = require('../schemas/Place');
const User = require('../schemas/User');
const { sendAuthorizationRequest } = require('../service/user.service');
const path = require('path');
const fs = require('fs');
const axiosAdapter = require('../adapter/axios.adapter');
const distance = require('google-distance-matrix');
require('dotenv').config();
const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GOOGLE_MAPS_API_KEY,
});
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

	bot
		.sendMessage(
			chatId,
			'Please send your location. If you are not at the place, turn off GPS and manually choose the location.',
			options,
		)
		.then(() => {
			bot.once('location', (msg) => {
				const { latitude, longitude } = msg.location;
				place.location = {
					latitude,
					longitude,
				};
				setTimeout(() => {
					sendPlaceName(chatId, bot, place);
				}, 1000);
			});
		});
}

//Sends a request for the user to enter the name of a place.
async function sendPlaceName(chatId, bot, place) {
	bot.sendMessage(chatId, 'Please enter the name of the place:').then(() => {
		bot.once('text', (msg) => {
			const name = msg.text;
			place.name = name;
			sendPlaceDescription(chatId, bot, place);
		});
	});
}

// Sends a request for the user to enter the description of a place.
async function sendPlaceDescription(chatId, bot, place) {
	bot
		.sendMessage(chatId, 'Please enter the description of the place:')
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
	bot
		.sendMessage(chatId, 'Please enter the rating of the place (from 1 to 5):')
		.then(() => {
			bot.once('text', (msg) => {
				const rating = parseInt(msg.text); // Parse the rating value as an integer
				if (isNaN(rating) || rating < 1 || rating > 5) {
					bot.sendMessage(
						chatId,
						'Invalid rating. Please enter a number from 1 to 5.',
					); // If the rating is not a valid number from 1 to 5, send an error message
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
			const fileName = `${fileId}.jpg`;

			// Path to the folder for saving photos
			const photosFolderPath = path.join(__dirname, '../photos');

			// Create the folder if it doesn't exist
			if (!fs.existsSync(photosFolderPath)) {
				fs.mkdirSync(photosFolderPath);
			}

			const filePath = path.join(photosFolderPath, fileName);

			// Download the photo
			const response = await axiosAdapter.getWithAdapter(fileUrl, {
				responseType: 'stream',
			});

			response.data.pipe(fs.createWriteStream(filePath));

			// Add the file path to the place.photos[] array
			place.photos = place.photos || [];
			place.photos.push(filePath);

			// Continue to expect the next photo to be sent
			bot.sendMessage(
				chatId,
				'Photo received! Please send the next one, or send any other message to finish.',
			);
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

// Function to get tourist places near a location
function getTouristPlaces(location) {
	return new Promise((resolve, reject) => {
		const places = []; // Array to store tourist places

		googleMapsClient.placesNearby(
			{
				location: [location.latitude, location.longitude],
				radius: 200000, // Search radius in meters (200 km = 200000 m)
				type: 'tourist_attraction', // Type of places to search (tourist attractions)
				language: 'UA', // Language of the results
				rankby: 'prominence', // Sort the results by prominence
			},
			(error, response) => {
				if (error) {
					console.error('Error with Places API', error);
					reject(error);
				} else {
					response.json.results.forEach((place) => {
						const name = place.name;
						const rating = place.rating || 'No rating';
						const latitude = place.geometry.location.lat;
						const longitude = place.geometry.location.lng;

						// Create a place object with name, location, and rating
						const placeObj = {
							name: name,
							location: {
								latitude: latitude,
								longitude: longitude,
							},
							rating: rating,
						};

						places.push(placeObj);
					});

					resolve(places);
				}
			},
		);
	});
}

async function handleSelectedPlace(chatId, bot, placeId) {
	try {
		const place = await Place.findOne({ _id: placeId });
		if (!place) {
			return;
		}

		const { name, description, rating, photos } = place;

		let message = `Name: ${name}\nDescription: ${description}\nRating: ${rating}\n`;

		if (photos && photos.length > 0) {
			const media = photos.map((photoPath) => ({
				type: 'photo',
				media: photoPath,
			}));
			await bot.sendMediaGroup(chatId, media);
		} else {
			message += 'No photos available.';
		}

		await bot.sendMessage(chatId, message);

		// Create the inline keyboard with the "Leave Feedback" button
		const keyboard = {
			inline_keyboard: [
				[
					{
						text: 'Leave Feedback',
						callback_data: 'leave_feedback',
					},
				],
			],
		};

		// Send the message with the inline keyboard
		await bot.sendMessage(chatId, 'Leave Feedback', {
			reply_markup: keyboard,
		});

		// Handle the callback query when the user clicks the "Leave Feedback" button
		bot.once('callback_query', async (query) => {
			if (query.data === 'leave_feedback') {
				// Prompt the user to enter the rating
				bot
					.sendMessage(
						chatId,
						'Please enter the rating of the place (from 1 to 5):',
					)
					.then(() => {
						bot.once('text', async (msg) => {
							const rating = parseInt(msg.text);
							if (isNaN(rating) || rating < 1 || rating > 5) {
								bot.sendMessage(
									chatId,
									'Invalid rating. Please enter a number from 1 to 5.',
								);
							} else {
								if (!Array.isArray(place.all_rating)) {
									place.all_rating = [];
								}
								place.all_rating.push(rating);

								// Calculate the new average rating
								const allRatings = place.all_rating;
								const sum = allRatings.reduce(
									(accumulator, currentRating) => accumulator + currentRating,
									0,
								);
								const averageRating = sum / allRatings.length;

								// Update the place's rating with the new average
								place.rating = averageRating;

								// Save the updated place object
								await place.save();

								// Send a message confirming the rating and the updated average rating
								const message = `Thank you for your rating!\nAverage Rating: ${averageRating}`;
								bot.sendMessage(chatId, message);
							}
						});
					});
			}
		});
	} catch (error) {
		console.error('Error handling selected place:', error);
	}
}

async function handleOptionalButtons(chatId, bot) {
	const user = await User.findOne({ telegramId: chatId });

	if (!user || !user.isAuthorized) {
		// if user !auth start auth
		return sendAuthorizationRequest(chatId, bot);
	}

	user?.telegramId === 605296057
		? (user.isAdmin = true)
		: (user.isAdmin = false);

	const inlineKeyboard = [
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
	];

	if (user.isAdmin) {
		inlineKeyboard.push([
			{
				text: 'Admin',
				callback_data: 'admin',
			},
		]);
	}

	const options = {
		reply_markup: {
			inline_keyboard: inlineKeyboard,
		},
	};

	return await bot.sendMessage(chatId, 'Please select an option:', options);
}

async function paginationCallback(bot) {
	bot.once('callback_query', async (query) => {
		const { message, data } = query;
		const chatId = message.chat.id;

		if (data.startsWith('placeId:')) {
			const placeId = data.split(':')[1];
			await handleSelectedPlace(chatId, bot, placeId);
		} else if (data.startsWith('prevPage:')) {
			// Handle previous page action
		} else if (data.startsWith('nextPage:')) {
			// Handle next page action
		}
	});
}
async function checkUserAuth(user, chatId, bot) {
	if (!user || !user.isAuthorized) {
		return sendAuthorizationRequest(chatId, bot);
	}
}

async function calculatingAllDistances(places, userLocation, distances) {
	for (const place of places) {
		const placeLocation = place.location;
		const distanceResult = await calculateDistance(userLocation, placeLocation);
		const km = distanceResult.km;
		const m = distanceResult.m;

		if (km > 200) {
			continue;
		}

		const rating = place.rating || 'No rating yet';
		const mapUrl = `https://www.google.com/maps/search/?api=1&query=${placeLocation.latitude},${placeLocation.longitude}`;

		const formattedDistance = {
			_id: place._id,
			name: place.name,
			km: km,
			m: m,
			description: place.description,
			all_rating: place.all_rating,
			rating: rating,
			latitude: placeLocation.latitude,
			longitude: placeLocation.longitude,
			mapUrl: mapUrl,
			photos: place.photos || null,
		};

		distances.push(formattedDistance);
	}
	return distances;
}

async function paginateSortDistances(
	distances,
	page,
	messageId,
	bot,
	chatId,
	user,
	placesFromDB,
) {
	distances.sort((a, b) => {
		const distanceA = a.km * 1000 + a.m;
		const distanceB = b.km * 1000 + b.m;
		return distanceA - distanceB;
	});

	const itemsPerPage = 5;
	const startIndex = (page - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedDistances = distances.slice(startIndex, endIndex);

	const formattedDistances = paginatedDistances.map((distance) => {
		const { name, km, m, rating, mapUrl } = distance;
		let message = `${name} - ${km} km ${m} m. Rating: ${rating} [Google Maps](${mapUrl})\n`;
		return message;
	});

	const totalPages = Math.ceil(distances.length / itemsPerPage);
	const currentPage = page;

	let message = formattedDistances.join('\n\n');
	message += `\n\nPage ${currentPage} of ${totalPages}`;

	let keyboard = [];

	if (currentPage > 1) {
		keyboard.push({
			text: 'Previous',
			callback_data: `prevPage:${currentPage - 1}`,
		});
	}

	if (currentPage < totalPages) {
		keyboard.push({
			text: 'Next',
			callback_data: `nextPage:${currentPage + 1}`,
		});
	}

	const options = {
		parse_mode: 'Markdown',
		reply_markup: {
			inline_keyboard: [keyboard],
		},
	};
	await showMessage(
		messageId,
		options,
		bot,
		chatId,
		message,
		user,
		paginatedDistances,
		placesFromDB,
		page,
	);
}

async function showMessage(
	messageId,
	options,
	bot,
	chatId,
	message,
	user,
	paginatedDistances,
	placesFromDB,
) {
	if (messageId) {
		await bot.editMessageText(message, {
			chat_id: chatId,
			message_id: messageId,
			...options,
		});

		const placeIdsOnPage = await paginatedDistances.map(
			(distance) => distance._id,
		);
		const placesFromDBFiltered = await placesFromDB.filter((place) =>
			placeIdsOnPage.includes(place._id),
		);
		const optFiltered = await placesFromDBFiltered.map((place) => {
			const text = place.name;
			const callback_data = place._id ? place._id.toString() : '';
			return {
				text,
				callback_data,
			};
		});

		const keyboardNamesFiltered = await {
			inline_keyboard: [
				optFiltered.map((opt) => ({
					...opt,
					callback_data: `placeId:${opt.callback_data}`,
				})),
			],
		};

		const mesText =
			optFiltered.length > 0
				? 'See photos or give a review'
				: 'No photos in there, check it on Google Maps';
		try {
			await bot.editMessageText(mesText, {
				chat_id: chatId,
				message_id: messageId + 1,
				reply_markup: keyboardNamesFiltered,
			});
		} catch (error) {
			return;
		}
	} else {
		const sentMessage = await bot.sendMessage(chatId, message, options);
		const newMessageId = sentMessage.message_id;
		user.lastMessageId = newMessageId;
		user.save();

		const placeIdsOnPage = paginatedDistances.map((distance) => distance.name);
		const placesFromDBFiltered = placesFromDB.filter((place) =>
			placeIdsOnPage.includes(place.name),
		);
		const optFiltered = placesFromDBFiltered.map((place) => {
			const text = place.name;
			const callback_data = place._id ? place._id.toString() : '';
			return {
				text,
				callback_data,
			};
		});

		if (optFiltered.length > 0) {
			const keyboardNamesFiltered = {
				inline_keyboard: [
					optFiltered.map((opt) => ({
						...opt,
						callback_data: `placeId:${opt.callback_data}`,
					})),
				],
			};
			const mesText =
				optFiltered.length > 0
					? 'See photos or give a review'
					: 'No photos in there, check it on Google Maps';
			await bot.sendMessage(chatId, mesText, {
				reply_markup: keyboardNamesFiltered,
			});
		}
	}
}

module.exports = {
	sendPlaceLocation,
	getTouristPlaces,
	calculateDistance,
	handleOptionalButtons,
	paginationCallback,
	showMessage,
	checkUserAuth,
	paginateSortDistances,
	calculatingAllDistances,
};
