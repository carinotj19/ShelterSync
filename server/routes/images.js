const router = require('express').Router();
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs;
mongoose.connection.once('open', () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
});

router.get('/:id', async (req, res) => {
  try {
    const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!file) {
      return res.status(404).send('Not found');
    }
    const readstream = gfs.createReadStream(file.filename);
    res.set('Content-Type', file.contentType);
    readstream.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
