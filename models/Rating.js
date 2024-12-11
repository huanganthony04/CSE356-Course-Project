const mongoose = require('mongoose');
const RatingSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    //_id field of video is not assigned by MongoDB, so it is a string
    video: {
        type: String,
        required: true
    },
    rating: {
        type: Boolean,
        default: null
    }
})

RatingSchema.index({ user: 1, video: 1 });

RatingSchema.set('autoIndex', false);
module.exports = mongoose.model('Rating', RatingSchema);