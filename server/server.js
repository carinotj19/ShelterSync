require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.get('/', (req, res) => res.send('API running'));

app.use('/auth', require('./routes/auth'));
app.use('/pets', require('./routes/pets'));
app.use('/adopt', require('./routes/adoption'));
app.use('/image', require('./routes/images'));

app.listen(process.env.PORT || 5000, () =>
    console.log('Server started on port', process.env.PORT)
);