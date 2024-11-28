const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const metadataSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    author: {
        //Use the username of the user
        type: String,
        required: true,
    },
    likes: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    }
});
metadataSchema.set('autoIndex', false);

const VideosSchema = new Schema({
    _id: String,
    metadata: metadataSchema,
    status: {
        type: String,
        enum : ['processing','complete'],
        default: 'processing'
    }
});

VideosSchema.set('autoIndex', false);
module.exports = mongoose.model('Video', VideosSchema);