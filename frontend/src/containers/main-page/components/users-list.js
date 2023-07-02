import React, { useEffect, useState } from 'react';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faTrashAlt, faUndo } from '@fortawesome/free-solid-svg-icons';
import useFetchData from '../../../hooks/useFetchData';

const UsersList = () => {
	const [noBannedUsersShouldUpdate, setNoBannedUsersShouldUpdate] =
		useState(false);
	const noBannedUsers = useFetchData(
		'http://localhost:3002/admin/noBannedUsers',
		noBannedUsersShouldUpdate,
	);

	const [bannedUsersShouldUpdate, setBannedUsersShouldUpdate] = useState(false);
	const bannedUsers = useFetchData(
		'http://localhost:3002/admin/bannedUsers',
		bannedUsersShouldUpdate,
	);

	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [unBanDialogOpen, setUnBanDialogOpen] = useState(false);
	const [banDialogOpen, setBanDialogOpen] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState('');

	useEffect(() => {
		console.log('No Banned Users:', noBannedUsers);
		console.log('Banned Users:', bannedUsers);
		setNoBannedUsersShouldUpdate(false);
		setBannedUsersShouldUpdate(false);
	}, [noBannedUsers, bannedUsers]);

	const formatDateTime = (dateTime) => {
		const date = new Date(dateTime);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');

		return `${day}-${month}-${year} - ${hours}-${minutes}`;
	};

	const handleDeleteUserPlaces = (userId) => {
		setSelectedUserId(userId);
		setConfirmDialogOpen(true);
	};

	const handleBanUser = (userId) => {
		setSelectedUserId(userId);
		setBanDialogOpen(true);
	};

	const handleUnbanUser = (userId) => {
		setSelectedUserId(userId);
		setUnBanDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		try {
			await fetch(
				`http://localhost:3002/admin/deleteByUser/${selectedUserId}`,
				{
					method: 'DELETE',
				},
			);
			console.log('User places deleted successfully');
		} catch (error) {
			console.error('Error deleting user places:', error);
		}
		setConfirmDialogOpen(false);
	};

	const handleConfirmBan = async () => {
		try {
			await fetch(`http://localhost:3002/admin/ban/${selectedUserId}`, {
				method: 'POST',
			});
			console.log('User banned successfully');
			setNoBannedUsersShouldUpdate(true);
			setBannedUsersShouldUpdate(true); // Обновление данных после бана пользователя
		} catch (error) {
			console.error('Error banning user:', error);
		}
		setBanDialogOpen(false);
	};

	const handleConfirmUnban = async () => {
		try {
			await fetch(`http://localhost:3002/admin/unban/${selectedUserId}`, {
				method: 'POST',
			});
			console.log('User unbanned successfully');
			setNoBannedUsersShouldUpdate(true);
			setBannedUsersShouldUpdate(true); // Обновление данных после анбана пользователя
		} catch (error) {
			console.error('Error unbanning user:', error);
		}
		setUnBanDialogOpen(false);
	};

	return (
		<>
			<div>
				<h2>Users without ban</h2>
				<ul className='user__list'>
					{noBannedUsers.map((user) => (
						<li key={user.telegramId} className='user__list-item'>
							<p>Username: {user.username}</p>
							<p>First Name: {user.firstName}</p>
							<p>Phone: {user.phone}</p>
							<p>Is Authorized: {user.isAuthorized ? 'Yes' : 'No'}</p>
							<p>
								Last Authorization Date:{' '}
								{formatDateTime(user.lastAuthorizationDate)}
							</p>
							<p>Is Admin: {user.isAdmin ? 'Yes' : 'No'}</p>
							<p>
								Location:{' '}
								<a
									href={`https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude}`}
									target='_blank'
									rel='noopener noreferrer'
								>
									View on Google Maps
								</a>
							</p>
							<p>Is Banned: {user.isBanned ? 'Yes' : 'No'}</p>
							<Button
								onClick={() => handleDeleteUserPlaces(user.telegramId)}
								variant='contained'
								color='secondary'
							>
								<FontAwesomeIcon icon={faTrashAlt} />
								Delete user places
							</Button>
							<Button
								onClick={() => handleBanUser(user.telegramId)}
								variant='contained'
								color='secondary'
							>
								<FontAwesomeIcon icon={faBan} />
								Ban
							</Button>
						</li>
					))}
				</ul>
			</div>
			<div>
				<h2>Banned Users</h2>
				<ul className='user__list'>
					{bannedUsers.map((user) => (
						<li key={user.telegramId} className='user__list-item'>
							<p>Username: {user.username}</p>
							<p>First Name: {user.firstName}</p>
							<p>Phone: {user.phone}</p>
							<p>Is Authorized: {user.isAuthorized ? 'Yes' : 'No'}</p>
							<p>
								Last Authorization Date:{' '}
								{formatDateTime(user.lastAuthorizationDate)}
							</p>
							<p>Is Admin: {user.isAdmin ? 'Yes' : 'No'}</p>
							<p>
								Location:{' '}
								<a
									href={`https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude}`}
									target='_blank'
									rel='noopener noreferrer'
								>
									View on Google Maps
								</a>
							</p>
							<p>Is Banned: {user.isBanned ? 'Yes' : 'No'}</p>
							<Button
								onClick={() => handleDeleteUserPlaces(user.telegramId)}
								variant='contained'
								color='secondary'
							>
								<FontAwesomeIcon icon={faTrashAlt} />
								Delete user places
							</Button>
							<Button
								onClick={() => handleUnbanUser(user.telegramId)}
								variant='contained'
								color='secondary'
							>
								<FontAwesomeIcon icon={faUndo} />
								Unban
							</Button>
						</li>
					))}
				</ul>
			</div>
			<Dialog
				open={confirmDialogOpen}
				onClose={() => setConfirmDialogOpen(false)}
			>
				<DialogTitle>Confirmation</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete the user`&apos;`s places?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleConfirmDelete}
						variant='contained'
						color='secondary'
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
				<DialogTitle>Confirmation</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to ban the user?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleConfirmBan}
						variant='contained'
						color='secondary'
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={unBanDialogOpen} onClose={() => setUnBanDialogOpen(false)}>
				<DialogTitle>Confirmation</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to unban the user?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setUnBanDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleConfirmUnban}
						variant='contained'
						color='secondary'
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default UsersList;
