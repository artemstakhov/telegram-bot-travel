Full Stack Developer:  TravelBot
-	Developed both the Front-End and Back-End.
-	Created a Telegram bot with travel-related functionalities which enabled users to discover places and add their own locations.
-	Used Google Maps API for location-based features and photo processing.
-	Effectively applied the Adapter Pattern in the backend to seamlessly integrate different functionalities.
-	Ensured that the project contained robust error logging and adhered to coding best practices with ESLint, Prettier and Husky to ensure code quality and consistent formatting in commits. 
-	Set up a Git Action to automatically validate the code against ESLint rules. 



Task: Development of a Travel Assistant Bot
Description:

The goal is to create a Telegram bot that will serve as a travel assistant. The bot will provide information about tourist attractions, landmarks, restaurants, and hotels, as well as offer travel routes through Google Maps. Users will be able to choose places for leisure or visitation, receive recommendations, and add their ratings and photos if they are authorized.

Requirements:

Telegram Bot:

The bot should be developed using the Telegram API.
The bot should provide the user with information about tourist attractions, landmarks, restaurants, and hotels based on user queries using geolocation.
The bot should offer travel routes through Google Maps.
Users should be able to explore interesting places and receive recommendations based on ratings.
The bot should allow users to add ratings and comments in text format for visited places.
The bot should support displaying photos of visited places.
The development of this bot should take into account the capabilities of the Telegram API, limitations on the number of requests, and other technical constraints of the platform.
Authentication and Registration:

Users should have the ability to authenticate and register within the bot.
Authentication should ensure security and access only to the user's personal data.
File and Image Handling:

The bot should support working with files, including images of landmarks and restaurants.
The bot should be able to send images to users in response to their requests.
Rating and Reviews:

Users should have the ability to rate visited places using numbers (e.g., from 1 to 5) and add textual comments to the places.
The bot should display the rating and reviews for each place.
User Roles:

The bot should support two types of users: regular users and administrators.
Regular users can add photos, leave ratings, access information about places, and send proposals to add new places.
Administrators should have access to an administrative panel through a link.
Administrators should be able to view and delete photos that were added by users and do not meet the requirements. They should also be able to review and approve or reject proposals to add places.
