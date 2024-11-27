const mongoose = require('mongoose');
const RatingSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        index: true
    },
    //_id field of video is not assigned by MongoDB, so it is a string
    video: {
        type: String,
        required: true,
        index: true
    },
    rating: {
        type: Boolean,
        default: null
    }
})

module.exports = mongoose.model('Rating', RatingSchema);