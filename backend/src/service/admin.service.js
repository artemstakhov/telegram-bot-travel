const Place = require('../schemas/Place');
const User = require('../schemas/User');
const { expressErrorLogger } = require('../adapter/pino.adapter');

const getPlaces = async () => {
	return await Place.find().lean();
};

const deleteUserPlaces = async (userId) => {
	await Place.deleteMany({ user_id: userId });
};

const deletePlace = async (placeId) => {
	return await Place.findByIdAndDelete(placeId).lean();
};

const getBannedUsers = async () => {
	return await User.find({ isBanned: true }).lean();
};

const getNonBannedUsers = async () => {
	return await User.find({ isBanned: false }).lean();
};

const banUser = async (userId) => {
	const user = await User.findOne({ telegramId: userId }).lean();

	if (!user) {
		expressErrorLogger('User not found');
	}

	await User.updateOne({ _id: user._id }, { isBanned: true });
};

const unbanUser = async (telegramId) => {
	const user = await User.findOne({ telegramId }).lean();

	if (!user) {
		expressErrorLogger('User not found');
		return;
	}

	await User.updateOne({ _id: user._id }, { isBanned: false });
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
