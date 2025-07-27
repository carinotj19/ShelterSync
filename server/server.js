// Load environment variables from .env
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB using the provided connection string
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Simple root route to verify API is working
app.get('/', (req, res) => res.send('API running'));

// Import and mount route handlers
app.use('/auth', require('./routes/auth'));
app.use('/pets', require('./routes/pets'));
app.use('/adopt', require('./routes/adoption'));
app.use('/image', require('./routes/images'));

// Start the server on the configured port or default to 5000
app.listen(process.env.PORT || 5000, () => {
  /* eslint-disable no-console */
  console.log('Server started on port', process.env.PORT);
});