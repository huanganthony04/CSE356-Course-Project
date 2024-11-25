require('dotenv').config();
const IORedis = require('ioredis')
const { Queue, Worker } = require('bullmq');

//Setup mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGOURI)
    .then(() => console.log('Connected to MongoDB'));

//Import models
const UserModel = require('../models/User');
const VideoModel = require('../models/Video');
const RatingModel = require('../models/Rating');
const RecommendationModel = require('../models/Recommendation');

const connection = new IORedis({
    maxRetriesPerRequest: null,
    host: process.env.REDIS_DOMAIN,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

const worker = new Worker('apiQueue', async (job) => {
    const { userId, videoId, ratingValue } = job.data;
    console.log(userId, videoId, ratingValue);
    let rating = await RatingModel.findOne(
        { user: userId, video: videoId }
    );
    if (!rating) {
        rating = new RatingModel({
            user: userId,
            video: videoId,
            rating: ratingValue,
        })
        try {
            await rating.save();
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        rating.rating = ratingValue;
        try {
            await rating.save();
        }
        catch (err) {
            console.log(err);
        }
    }
}, {connection, concurrency: 4});

worker.on('completed', async (job) => {
    console.log(`${job.id} has completed!`);
});
worker.on('failed', async (job, err) => {
    console.log(`${job.id} has failed! ${err}`);
});