const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const metadataSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    author:{
        type: String,
        required: true,
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Users'
    }]
}, { toJSON: { virtuals: true } }) ;

metadataSchema.virtual('likes').get(function() {
    return this.likedBy.length;
});

const VideosSchema = new Schema({
    _id: String,
    metadata: metadataSchema
});

module.exports = mongoose.model('Video', VideosSchema);