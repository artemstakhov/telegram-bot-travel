const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	rating: {
		type: Number,
	},
	all_rating: [Number],
	photos: [String],
	location: {
		latitude: {
			type: Number,
		},
		longitude: {
			type: Number,
		},
	},
	user_id: {
		type: Number,
	},
});

const Place = mongoose.model('Place', placeSchema);

module.exports = Place;
