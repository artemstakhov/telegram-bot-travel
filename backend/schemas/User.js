const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  phone: {
    type: String,
  },
  isAuthorized: {
    type: Boolean,
    default: false,
  },
  lastAuthorizationDate: {
    type: Date,
  },
  location: {
    type: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
