const { Queue } = require('bullmq');

require('dotenv').config();
const IORedis = require('ioredis')
const mongoose = require('mongoose');
const UserModel = require('./models/User');
const RatingModel = require('./models/Rating');
const RecommendationModel = require('./models/Recommendation');
const VideoModel = require('./models/Video');
const connection = new IORedis({
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD
});

mongoose.connect(process.env.MONGOURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Could not connect to MongoDB: ' + err));

const queue = new Queue('videoQueue',{connection});
const db = mongoose.connection;

async function cleanup() {
    await queue.drain();
    await UserModel.collection.deleteMany({});
    await RatingModel.collection.deleteMany({});
    await RecommendationModel.collection.deleteMany({});
    await VideoModel.collection.updateMany({}, { $set: { "metadata.likes":0, "metadata.views": 0 } });
    await VideoModel.collection.deleteMany({ "status": "processing" });
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