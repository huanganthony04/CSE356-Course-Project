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
    }
});

const VideosSchema = new Schema({
    _id: String,
    metadata: metadataSchema
});

module.exports = mongoose.model('Video', VideosSchema);