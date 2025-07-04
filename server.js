const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/dbconnect.js');
const initRoutes = require('./routes/index.js'); // Import routes
const cookieParser = require('cookie-parser'); // Middleware for parsing cookies

const app = express();
app.use(cookieParser());
dotenv.config(); // Load environment variables from .env file   
const PORT = process.env.PORT || 8888;      // Default port if not specified in .env
app.use(express.json());        // Middleware to parse JSON data
app.use(express.urlencoded({ extended: true })); // Middleware to parse JSON and URL-encoded data
connectDB(); // Connect to MongoDB
initRoutes(app); // Initialize routes
app.get('/', (req, res) => {
    res.send('server is running');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});