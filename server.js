require('dotenv').config(); // Load environment variables from .env file
const http = require('http');
const mongoose = require('mongoose');
const url = require('url');
const cors = require('cors'); // Import cors package

// Set up CORS options
const corsOptions = {
  origin: 'http://localhost:8080', // Allow frontend (Vue.js) to access backend (Node.js)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Weather Schema
const weatherSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  humidity: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Weather = mongoose.model('Weather', weatherSchema);

// Helper function to send a JSON response
const sendJSONResponse = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Apply CORS headers to each response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));

  const reqUrl = url.parse(req.url, true);
  
  // Route: Get all weather data for all cities
  if (req.method === 'GET' && reqUrl.pathname === '/api') {
    Weather.find()
      .then((weatherData) => {
        sendJSONResponse(res, 200, weatherData);
      })
      .catch((error) => {
        console.error('Error fetching weather data:', error);
        sendJSONResponse(res, 500, { error: 'Error fetching weather data' });
      });
  }

  // Route: Get specific city data
  else if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/')) {

    // Decode the city name in case it has spaces
    const city = decodeURIComponent(reqUrl.pathname.replace('/api/', ''));
    Weather.findOne({ city: city })
      .then((weatherData) => {
        if (!weatherData) {
          sendJSONResponse(res, 404, { error: 'City not found' });
        } else {
          sendJSONResponse(res, 200, weatherData);
        }
      })
      .catch((error) => {
        console.error('Error fetching weather data for city:', error);
        sendJSONResponse(res, 500, { error: 'Error fetching weather data for the city' });
      });
  }
  // 404 Not Found for other routes
  else {
    sendJSONResponse(res, 404, { error: 'Route not found' });
  }
});

// Start the server
const port = process.env.PORT || 5001;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

