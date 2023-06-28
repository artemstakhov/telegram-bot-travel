const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	telegramId: {
		type: Number,
		unique: true,
		required: true,
	},
	username: {
		type: String,
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
	lastMessageId: {
		type: Number,
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
	isBanned:{
		type: Boolean,
		default: false,
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
