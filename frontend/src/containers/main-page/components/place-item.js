// PlaceItem.js
import {
	ImageList,
	ImageListItem,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material';
import React, { useState } from 'react';

const PlaceItem = (props) => {
	const { name, description, rating, photos, _id, handleDeletePlace } = props;

	const updatedPhotos = photos.map((item) => {
		const startIndex = item.indexOf('backend');
		return '../../../../' + item.substring(startIndex).replace(/\\/g, '/');
	});

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const handleDelete = () => {
		setDeleteDialogOpen(true);
	};

	const handleCancelDelete = () => {
		setDeleteDialogOpen(false);
	};

	const handleConfirmDelete = async () => {
		try {
			await handleDeletePlace(_id);
		} catch (error) {
			console.error('Error deleting place:', error);
		}
		setDeleteDialogOpen(false);
	};

	return (
		<div className='place__list-item'>
			<span>Name: {name}</span>
			<span>Description: {description}</span>
			<span>Rating: {rating}</span>
			Photos:
			<ImageList cols={3} rowHeight={164}>
				{updatedPhotos.map((item, i) => (
					<ImageListItem key={item}>
						<img
							src={item}
							srcSet={item}
							alt={`photo ${i + 1}`}
							loading='lazy'
						/>
					</ImageListItem>
				))}
			</ImageList>
			<Button onClick={handleDelete} variant='contained' color='secondary'>
				Delete Place
			</Button>
			<Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
				<DialogTitle>Confirmation</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete this place?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelDelete}>Cancel</Button>
					<Button
						onClick={handleConfirmDelete}
						variant='contained'
						color='secondary'
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default PlaceItem;
