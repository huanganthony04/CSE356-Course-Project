const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    watchHistory: [{
        type: String
    }],
    verified: Boolean,
    verificationKey: {
        type: String
    }
});

UsersSchema.set('autoIndex', false);
module.exports = mongoose.model('Users', UsersSchema);