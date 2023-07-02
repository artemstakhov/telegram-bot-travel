import Header from '../../components/header';
import PlaceList from './components/places-list';
import UsersList from './components/users-list';
import './main-page.sass';

const MainPage = () => {
	return (
		<>
			<Header />
			<PlaceList />
			<UsersList />
		</>
	);
};

export default MainPage;
