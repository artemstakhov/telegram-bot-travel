const Place = require('../schemas/Place');
const User = require('../schemas/User');

const getPlaces = async (req, res, next) => {
	try {
		const places = await Place.find();
		res.status(200).json(places);
	} catch (err) {
		next(err);
	}
};

const deleteUserPlaces = async (req, res, next) => {
	const userId = req.params.id;

	try {
		await Place.deleteMany({ user_id: userId });

		res.status(200).json({ message: 'Places deleted' });
	} catch (err) {
		next(err);
	}
};

const deletePlace = async (req, res, next) => {
	const placeId = req.params.id;

	try {
		const deletedPlace = await Place.findByIdAndDelete(placeId);

		if (deletedPlace) {
			res.status(200).json({ message: 'Place deleted' });
		} else {
			res.status(404).json({ message: 'Place not found' });
		}
	} catch (err) {
		next(err);
	}
};

const showBannedUsers = async (req, res, next) => {
	try {
		const bannedUsers = await User.find({ isBanned: true });
		res.status(200).json(bannedUsers);
	} catch (err) {
		next(err);
	}
};

module.exports = {
	getPlaces,
	deleteUserPlaces,
	deletePlace,
	showBannedUsers,
};