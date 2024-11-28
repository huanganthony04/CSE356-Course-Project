const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecommendationSchema = new Schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    videoIds: [{
        type: String
    }],

    //Not an index in the context of databases, an index in context of the videoId array.
    index: {
        type: Number,
        default: 0
    }
})

RecommendationSchema.set('autoIndex', false);
module.exports = mongoose.model('Recommendation', RecommendationSchema);