const adminService = require('../service/admin.service');

const getPlaces = async (req, res, next) => {
	try {
		const places = await adminService.getPlaces();
		res.status(200).json(places);
	} catch (err) {
		next(err);
	}
};

const deleteUserPlaces = async (req, res, next) => {
	const userId = req.params.id;

	try {
		await adminService.deleteUserPlaces(userId);
		res.status(200).json({ message: 'Places deleted' });
	} catch (err) {
		next(err);
	}
};

const deletePlace = async (req, res, next) => {
	const placeId = req.params.id;

	try {
		const deletedPlace = await adminService.deletePlace(placeId);

		if (deletedPlace) {
			res.status(200).json({ message: 'Place deleted' });
			return;
		}

		res.status(404).json({ message: 'Place not found' });
	} catch (err) {
		next(err);
	}
};

const showBannedUsers = async (req, res, next) => {
	try {
		const bannedUsers = await adminService.getBannedUsers();
		res.status(200).json(bannedUsers);
	} catch (err) {
		next(err);
	}
};

const showNonBannedUsers = async (req, res, next) => {
	try {
		const nonBannedUsers = await adminService.getNonBannedUsers();
		res.status(200).json(nonBannedUsers);
	} catch (err) {
		next(err);
	}
};

const banUser = async (req, res, next) => {
	const userId = req.params.id;

	try {
		await adminService.banUser(userId);
		res.status(200).json({ message: 'User banned' });
	} catch (err) {
		next(err);
	}
};

const unBanUser = async (req, res, next) => {
	const telegramId = req.params.id;

	try {
		await adminService.unbanUser(telegramId);
		res.status(200).json({ message: 'User unbanned' });
	} catch (err) {
		next(err);
	}
};

module.exports = {
	getPlaces,
	deleteUserPlaces,
	deletePlace,
	showBannedUsers,
	showNonBannedUsers,
	banUser,
	unBanUser,
};
