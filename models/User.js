const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
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

module.exports = mongoose.model('Users', UsersSchema);