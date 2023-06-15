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
      required: true,
    },
    all_rating: [Number],
    photos: [
      {
        type: String,
      },
    ],
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  });
  
  
  const Place = mongoose.model('Place', placeSchema);
  
  module.exports = Place;
  