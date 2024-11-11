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
        //Use the username of the user
        type: String,
        required: true,
    }
}, { toJSON: { virtuals: true } }) ;

const VideosSchema = new Schema({
    _id: String,
    metadata: metadataSchema,
    status: {
        type: String,
        enum : ['processing','complete'],
        default: 'processing'
    }
});

module.exports = mongoose.model('Video', VideosSchema);