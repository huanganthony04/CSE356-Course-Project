const { Queue } = require('bullmq');

require('dotenv').config();

const mongoose = require('mongoose');
const UserModel = require('./models/User');
const RatingModel = require('./models/Rating');
const RecommendationModel = require('./models/Recommendation');

mongoose.connect(process.env.MONGOURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Could not connect to MongoDB: ' + err));

const queue = new Queue('videoQueue');
const db = mongoose.connection;

async function cleanup() {
    await queue.drain();
    await UserModel.collection.drop();
    await RatingModel.collection.drop();
    await RecommendationModel.collection.drop();
}

try {
    cleanup();
}
catch (err) {
    console.log('Error cleaning up: ' + err);
}

async function main() {
    await cleanup();
    process.exit(0);
}

main();