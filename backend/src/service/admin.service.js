const Place = require('../schemas/Place');
const User = require('../schemas/User');

const getPlaces = async () => {
	return await Place.find();
};

const deleteUserPlaces = async (userId) => {
	await Place.deleteMany({ user_id: userId });
};

const deletePlace = async (placeId) => {
	return await Place.findByIdAndDelete(placeId);
};

const getBannedUsers = async () => {
	return await User.find({ isBanned: true });
};

const getNonBannedUsers = async () => {
	return await User.find({ isBanned: false });
};

const banUser = async (userId) => {
	const user = await User.findOne({ telegramId: userId });

	if (!user) {
		throw new Error('User not found');
	}

	user.isBanned = true;
	await user.save();
};

const unbanUser = async (telegramId) => {
	const user = await User.findOne({ telegramId });

	if (!user) {
		throw new Error('User not found');
	}

	user.isBanned = false;
	await user.save();
};

module.exports = {
	getPlaces,
	deleteUserPlaces,
	deletePlace,
	getBannedUsers,
	getNonBannedUsers,
	banUser,
	unbanUser,
};
