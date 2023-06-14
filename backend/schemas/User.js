const mongoose = require("mongoose");

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
  firstName: String,
  isAuthorized: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
