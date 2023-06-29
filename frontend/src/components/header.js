import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { Button } from '@mui/material';

const Header = () => {
	const openTelegram = () => {
		window.open('https://t.me/travel_js_bot');
	};

	return (
		<header>
			<h2>Admin Panel</h2>
			<Button variant='outlined' onClick={openTelegram}>
				Back to <FontAwesomeIcon icon={faTelegram} style={{ marginLeft: 5 }} />
			</Button>
		</header>
	);
};

export default Header;
