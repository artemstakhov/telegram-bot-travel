const Place = require('../schemas/Place');

const getPlaces = async (req, res, next) => {
	try {
		const places = await Place.find();
		res.status(200).json(places);
	} catch (err) {
		next(err);
	}
};

module.exports = {
	getPlaces,
};
