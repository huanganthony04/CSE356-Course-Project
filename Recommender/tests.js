require('dotenv').config();

const { MongoClient } = require('mongodb');
const UserModel = require('../models/User');
const RatingModel = require('../models/Rating');
const RecommendationModel = require('../models/Recommendation');


const mongoose = require('mongoose');
mongoose.connect(process.env.MONGOURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Could not connect to MongoDB: ' + err));

mongoose.set('debug', true);


const client = new MongoClient(process.env.MONGOURI);

async function connect() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db();
    }
    catch (err) {
        console.log('Could not connect to MongoDB: ' + err);
    }
}

async function likeTable() {
    let ratings = await RatingModel.find();
    let videoMap = new Map();
    for(let rating of ratings) {
        let video = rating.video;
        let user = await UserModel.findOne({ username: rating.user });
        if (videoMap.has(video)) {
            let count = videoMap.get(video);
            videoMap.set(video, count.concat(user.username));
        }
        else {
            videoMap.set(video, [ user.username ]);
        }
    }

    let users = await UserModel.find();

    let array = [];
    let videoIndex = 0;

    let userMap = new Map();
    for(let i = 0; i < users.length; i++) {
        userMap.set(users[i].username, i);
    }

    let videos = [];

    videoMap.forEach((likedUsers, video) => {

        let videoArray = new Array(users.length).fill(0);
    
        for(let user of likedUsers) {
    
            let index = userMap.get(user);
            videoArray[index] = 1;
    
        }

        array[videoIndex] = videoArray;
        videos[videoIndex] = video;
        videoIndex++;

    })

    const likeTable = array.map((row, rowIndex) => {
        const labeledRow = { Row: videos[rowIndex] };
        users.forEach((user, userIndex) => {
            labeledRow[user.username] = row[userIndex];
        });
        return labeledRow;
    })

    console.table(likeTable);
}

async function queryTestMongoose() {
    const start = performance.now();
    let results = await RatingModel.find({ video: '55bb48c733b85e01' });
    console.log(results);
    const end = performance.now();

    console.log(`Query took ${end - start} ms`);
}

async function test() {
    await queryTestMongoose();
}

async function main() {
    try {
        await test();
    }
    catch (err) {
        console.log(err);
    }
    process.exit(0);
}

main();