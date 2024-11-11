const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecommendationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoIds: [{
        type: String
    }],
    index: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('Recommendation', RecommendationSchema);