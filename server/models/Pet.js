const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  breed: String,
  age: Number,
  healthNotes: String,
  imageURL: String,
  location: String,
  shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Pet', petSchema);