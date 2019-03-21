// the Review model

var mongoose = require('mongoose');

const PreviousSchema = new mongoose.Schema({
    album_cover: {
      type: String
    },
    movie_poster: {
      type: String
    },
    movie_name: {
      type: String
    }
});

const Previous = mongoose.model('Previous', PreviousSchema);
module.exports = Previous;