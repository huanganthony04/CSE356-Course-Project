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
    },
    //likedBy also tracks who watched the video.
    likedBy: [{
        userId: {
            type: String,
            required: true
        },
        likeType: {
            type: Boolean,
            default: null
        }
    }],
    
}, { toJSON: { virtuals: true } }) ;

metadataSchema.virtual('likes').get(function() {
    return this.likedBy.reduce((acc, like) => {
        if(like.likeType === true) {
            return acc + 1;
        } else if (like.likeType === false) {
            return acc - 1;
        }
        else {
            return acc;
        }
    })
});

metadataSchema.virtual('views').get(function() {
    return this.likedBy.length;
})

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