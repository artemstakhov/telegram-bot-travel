// PlaceList.js
import React, { useEffect, useMemo, useState } from 'react';
import PlaceItem from './place-item';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PlaceList = () => {
	const [loading, setLoading] = useState(true);
	const [places, setPlaces] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await fetch('http://localhost:3002/admin/all');
				const placesData = await data.json();
				setPlaces(placesData);
				setLoading(false);
			} catch (error) {
				console.error('Error fetching places:', error);
			}
		};

		fetchData();
	}, []);

	const handleDeletePlace = async (placeId) => {
		try {
			await fetch(`http://localhost:3002/admin/delete/${placeId}`, {
				method: 'DELETE',
			});
			console.log('Place deleted successfully');
			const updatedPlaces = places.filter((place) => place._id !== placeId);
			setPlaces(updatedPlaces);
		} catch (error) {
			console.error('Error deleting place:', error);
		}
	};

	const renderedPlaces = useMemo(() => {
		return places.map((item) => (
			<PlaceItem
				key={item._id}
				name={item.name}
				description={item.description}
				rating={item.rating}
				photos={item.photos}
				_id={item._id}
				handleDeletePlace={handleDeletePlace}
			/>
		));
	}, [places]);

	return (
		<div className='place__list'>
			{loading ? (
				<div className='spinner'>
					<FontAwesomeIcon icon={faSpinner} spin />
				</div>
			) : (
				renderedPlaces
			)}
		</div>
	);
};

export default PlaceList;
