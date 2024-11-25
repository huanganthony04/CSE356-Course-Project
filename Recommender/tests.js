require('dotenv').config();

const mongoose = require('mongoose');
const UserModel = require('../models/User');
const RatingModel = require('../models/Rating');
const RecommendationModel = require('../models/Recommendation');

mongoose.connect(process.env.MONGOURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Could not connect to MongoDB: ' + err));

async function tallyLikes() {
    let ratings = await RatingModel.find();
    let videoMap = new Map();
    for(let rating of ratings) {
        let video = rating.video;
        let user = await UserModel.findOne({ _id: rating.user });
        if (videoMap.has(video)) {
            let count = videoMap.get(video);
            videoMap.set(video, count.concat(user.username));
        }
        else {
            videoMap.set(video, [ user.username ]);
        }
    }
    console.log(videoMap);
}

async function test() {
    await tallyLikes();
}

async function main() {
    try {
        await test();
    }
    catch (err) {
        console.log('Error during test: ' + err);
    }
    process.exit(0);
}

main();