import { useState, useEffect, useCallback } from 'react';

const useFetchData = (url, shouldUpdate) => {
	const [data, setData] = useState([]);

	const fetchData = useCallback(async () => {
		try {
			const response = await fetch(url);
			const result = await response.json();
			setData(result);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	}, [url]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		if (shouldUpdate) {
			fetchData();
		}
	}, [shouldUpdate, fetchData]);

	return data;
};

export default useFetchData;
