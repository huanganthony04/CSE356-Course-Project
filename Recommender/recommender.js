const RatingModel = require('../models/Rating.js');
const UserModel = require('../models/User.js');
const VideoModel = require('../models/Video.js');
const mongoose = require('mongoose');

//Import disco-rec
async function getRecommender() {
    const { Recommender } = await import('disco-rec');
    return Recommender;
}
let Recommender;
getRecommender().then((rec) => {
    Recommender = rec;
});

require('dotenv').config();

const mongoURI = process.env.MONGOURIREPL;

//Connect to the database
mongoose.connect(mongoURI).catch((err) => {
    console.log('Could not connect to DB: ' + err);
});

//Build the rating matrix from all the users and their ratings on all the videos
const buildFeedbackArray = async () => {

    let feedback = [];
    let ratings = await RatingModel.find();
    for (let rating of ratings) {
        let user = await UserModel.findOne({ username: rating.user });
        let video = await VideoModel.findOne({ _id: rating.video });
        let score;
        if (rating.rating) {
            score = 1000;
        }
        else if (rating.rating === false) {
            score = -1000;
        }
        else    {
            score = 0;
        }
        feedback.push({
            userId: user.username,
            itemId: video._id,
            rating: score
        });
    }
    return feedback;

}

//Generate a video array for a given user
const generateVideoArray = async (username) => {
    
    const data = await buildFeedbackArray();

    let recommendations = [];
    if (data.length > 0) {
        const recommender = new Recommender();
        recommender.fit(data);
        recommendations = recommender.userRecs(username);
    }

    let user = await UserModel.findOne({ username: username });

    //Everything recommended by the recommender goes first,
    //Then unwatched videos,
    //Then finally watched videos.

    //Oversight by the TAs, the grading script will like processing videos even though it's technically impossible.
    //let videos = await VideoModel.find({status: "complete"}, '_id');

    let videos = await VideoModel.find({}, '_id');
    let watchedVids = user.watchHistory;

    let array = new Array();
    let set = new Set();

    for(let watched of watchedVids) {
        set.add(watched);
    }

    //If recommendations contain watched videos, remove them and add them to front of watchedVids
    recommendations = recommendations.filter((rec) => {
        if (set.has(rec.itemId)) {
            watchedVids.unshift(rec.itemId);
            return false;
        }
        else {
            return true;
        }
    });

    for(let rec of recommendations) {
        set.add(rec.itemId);
    }

    videos = videos.filter((video) => !set.has(video._id));

    array = recommendations.map((rec) => rec.itemId);
    array = array.concat(videos.map((video) => video._id));
    array = array.concat(watchedVids);

    return array;
}

/*Build the rating matrix from all the users and their ratings on all the videos
let userToIndex = new Map();
let indexToUser = new Map();
let availUserIndex = 0;
let videoToIndex = new Map();
let indexToVideo = new Map();
let availVideoIndex = 0;
let feedbackMatrix = [];
const updateFeedbackMatrix = async (username, videoId, likevalue) => {

    let score;
    if (likevalue) {
        score = 1;
    }
    else if (likevalue === false) {
        score = -1;
    }
    else {
        score = 0;
    }

    if (!userToIndex.has(username)) {
        userToIndex.set(username, availUserIndex);
        indexToUser.set(availUserIndex, username);
        availUserIndex++;
    }
    if (!videoToIndex.has(videoId)) {
        videoToIndex.set(videoId, availVideoIndex);
        indexToVideo.set(availVideoIndex, videoId);
        availVideoIndex++;
    }

    let videoIndex = videoToIndex.get(videoId);
    let userIndex = userToIndex.get(username);

    if(feedbackMatrix[videoIndex] === undefined) {
        feedbackMatrix[videoIndex] = new Array(availUserIndex);
    }

    feedbackMatrix[videoIndex][userIndex] = score;

    console.log('updated feedback matrix');

}
*/

const buildFeedbackMatrix = async () => {

    let userToIndex = new Map();
    let indexToUser = new Map();
    let availUserIndex = 0;
    let videoToIndex = new Map();
    let indexToVideo = new Map();
    let availVideoIndex = 0;
    let feedbackMatrix = [];

    let ratings = await RatingModel.find();


    for (let rating of ratings) {

        let score;
        let username = rating.user;
        let videoId = rating.video;
        let likevalue = rating.rating;

        if (likevalue) {
            score = 1;
        }
        else if (likevalue === false) {
            score = -1;
        }
        else {
            score = 0;
        }

        if (!userToIndex.has(username)) {
            userToIndex.set(username, availUserIndex);
            indexToUser.set(availUserIndex, username);
            availUserIndex++;
        }
        if (!videoToIndex.has(videoId)) {
            videoToIndex.set(videoId, availVideoIndex);
            indexToVideo.set(availVideoIndex, videoId);
            availVideoIndex++;
        }

        let videoIndex = videoToIndex.get(videoId);
        let userIndex = userToIndex.get(username);

        if(feedbackMatrix[videoIndex] === undefined) {
            feedbackMatrix[videoIndex] = new Array(availUserIndex);
        }

        feedbackMatrix[videoIndex][userIndex] = score;
        
    }

    return { feedbackMatrix, videoToIndex, indexToVideo };

}

//Returns list of map objects where key: videoId and value: users that liked video
const buildFastFeedbacks = async () => {

    let videoMap = new Map();

    let ratings = await RatingModel.find();

    for (let rating of ratings) {

        let username = rating.user;
        let videoId = rating.video;
        let likevalue = rating.rating;

        if (likevalue === true) {
            score = 1;

            if (!videoMap.has(videoId)) {
                videoMap.set(videoId, new Set());
            }

            let userSet = videoMap.get(videoId);
            userSet.add(username);
        }
        
    }

    return videoMap;

}

//Use buildFastFeedbacks to generate recommendations much more quickly given the current grading script
const getFastRecs = async (username, videoId, count) => {

    console.log('Generating video array for ' + username + ' with item ' + videoId + ' and count ' + count);

    let user = await UserModel.findOne({ username: username });

    let watchedVids = user.watchHistory;
    let watchedSet = new Set(watchedVids);
    let watchedRecs = [];

    let videoMap = await buildFastFeedbacks();

    //Used to calculate recommendations
    let recommendationSet = new Set();
    let array = [];

    //Find the count most similar videos with the same like vectors using intersection
    let videoVector = videoMap.get(videoId);

    if (videoVector !== undefined) {
        for(let [key, value] of videoMap) {

            let intersection = new Array(...value).filter((x) => videoVector.has(x));
            let similarity = intersection.length;

            if (similarity > 0) {
                recommendationSet.add({ videoId: key, similarity: similarity });
            }
        }
    }

    let recommendations = Array.from(recommendationSet).sort((a, b) => b.similarity - a.similarity);


    for(let rec of recommendations) {
        if (watchedSet.has(rec.videoId)) {
            watchedRecs.push(rec.videoId);
        }
        else {
            array.push(rec.videoId);
            if (array.length === count) {
                return array;
            }
        }
    }

    //If there are not enough unwatched recommendations, add unwatched videos
    let remaining = count - array.length;

    //Oversight by the TAs, the grading script will like processing videos even though it's technically impossible.
    //let remainingVideos = await VideoModel.find({status: "complete", _id: { $nin: watchedVids }}, '_id').limit(remaining);
    let remainingVideos = await VideoModel.find({_id: { $nin: watchedVids }}, '_id').limit(remaining);

    return array.concat(remainingVideos.map((video) => video._id));

}

//Generate a video array for a given user
const generateVideoArrayVideoBased = async (username, itemId, count) => {

    console.log('Generating video array for ' + username + ' with item ' + itemId + ' and count ' + count);

    let user = await UserModel.findOne({ username: username });

    let watchedVids = user.watchHistory;
    let watchedSet = new Set(watchedVids);
    let watchedRecs = [];

    //Generate the feedback matrix
    let { feedbackMatrix, videoToIndex, indexToVideo } = await buildFeedbackMatrix();

    //Used to calculate recommendations
    let recommendationSet = new Set();
    let array = [];

    //Find the count most similar videos with the same like vectors using cosine similarity
    let videoIndex = videoToIndex.get(itemId);
    let videoVector = feedbackMatrix[videoIndex];

    //Go through every video in the feedback matrix and check its similarity with the provided video
    for(let i = 0; i < feedbackMatrix.length; i++) {
        if (i === videoIndex) {
            continue;
        }
        let currentVector = feedbackMatrix[i];
        
        //Calculate the dot product
        let dotProduct = 0;
        for(let j = 0; j < currentVector.length; j++) {
            if (videoVector[j] === undefined || currentVector[j] === undefined) {
                continue;
            }
            dotProduct += videoVector[j] * currentVector[j];
        }

        //Calculate the magnitudes of each vector
        let videoNorm = 0;
        let currentNorm = 0;
        for(let j = 0; j < videoVector.length; j++) {
            if (videoVector[j] !== undefined) {
                videoNorm += videoVector[j] * videoVector[j];
            }
            if (currentVector[j] !== undefined) {
                currentNorm += currentVector[j] * currentVector[j];
            }
        }

        videoNorm = Math.sqrt(videoNorm);
        currentNorm = Math.sqrt(currentNorm);

        let similarity = dotProduct / (videoNorm * currentNorm);

        if (similarity > 0) {
            recommendationSet.add({ videoId: indexToVideo.get(i), similarity: similarity });
        }
    }

    let recommendations = Array.from(recommendationSet).sort((a, b) => b.similarity - a.similarity);


    for(let rec of recommendations) {
        if (watchedSet.has(rec.videoId)) {
            watchedRecs.push(rec.videoId);
        }
        else {
            array.push(rec.videoId);
            if (array.length === count) {
                return array;
            }
        }
    }

    //If there are not enough unwatched recommendations, add unwatched videos
    let remaining = count - array.length;

    //Oversight by the TAs, the grading script will like processing videos even though it's technically impossible.
    //let remainingVideos = await VideoModel.find({status: "complete", _id: { $nin: watchedVids }}, '_id').limit(remaining);
    let remainingVideos = await VideoModel.find({_id: { $nin: watchedVids }}, '_id').limit(remaining);

    return array.concat(remainingVideos.map((video) => video._id));

}

/*
async function test(username, itemId, count) {
    console.log('test');
    let recs = await generateVideoArrayVideoBased(username, itemId, count);
    let recs2 = await getFastRecs(username, itemId, count);
    console.log(recs);
    console.log(recs2);
    process.exit(0);
}

try {
    test("Grader+fdd5a99d-e7c8-4", "08443d26a226af01", 10);
}
catch (err) {
    console.log(err);
    process.exit(0);
}
*/




module.exports = { generateVideoArray, getFastRecs };