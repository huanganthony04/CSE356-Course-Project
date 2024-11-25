import RatingModel from '../models/Rating.js';
import UserModel from '../models/User.js';
import VideoModel from '../models/Video.js';
import mongoose from 'mongoose';
import { Recommender } from 'disco-rec';

import dotenv from 'dotenv';
dotenv.config();
const mongoURI = process.env.MONGOURI;


//Connect to the database
mongoose.connect(mongoURI).catch((err) => {
    console.log('Could not connect to DB: ' + err);
});

//Build the rating matrix from all the users and their ratings on all the videos
const buildFeedbackArray = async () => {

    let feedback = [];
    let ratings = await RatingModel.find();
    for (let rating of ratings) {
        let user = await UserModel.findOne({ _id: rating.user });
        let video = await VideoModel.findOne({ _id: rating.video });
        let score;
        if (rating.rating) {
            score = 1;
        }
        else if (rating.rating === false) {
            score = -1;
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

    let videos = await VideoModel.find({status: "complete"}, '_id');
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

//For the video based recommendation system, items and users are swapped. This is because disco-rec offers a similarUsers method, so we use that to find similar items.

//Build the rating matrix from all the users and their ratings on all the videos
const buildFeedbackArrayVideoBased = async () => {

    let feedback = [];
    let ratings = await RatingModel.find();
    for (let rating of ratings) {
        let user = await UserModel.findOne({ _id: rating.user });
        let video = await VideoModel.findOne({ _id: rating.video });
        let score;
        if (rating.rating) {
            score = 1;
        }
        else if (rating.rating === false) {
            score = -1;
        }
        else    {
            score = 0;
        }
        feedback.push({
            userId: video._id,
            itemId: user.username,
            rating: score
        });
    }
    return feedback;

}

//Generate a video array for a given user
const generateVideoArrayVideoBased = async (username, itemId, count) => {
    
    const data = await buildFeedbackArrayVideoBased();
    let recommendations = [];
    if (data.length > 0) {
        const recommender = new Recommender();
        recommender.fit(data);

        //Remember that users and items are swapped in the video based recommendation system
        recommendations = recommender.similarUsers(itemId);
        if (recommendations.length >= count) {
            let array = [];
            for (let i = 0; i < count; i++) {
                array.push(recommendations[i].userId);
            }
            return array;
        }
    }


    let user = await UserModel.findOne({ username: username });

    //Everything recommended by the recommender goes first,
    //Then unwatched videos,
    //Then finally watched videos.

    let remaining = count - recommendations.length;
    recommendations = recommendations.map((rec) => rec.userId);

    //If recommendations contain watched videos, remove them and add them to the back
    let watchedVids = user.watchHistory;
    let watchedSet = new Set(watchedVids);
    let watchedRecs = [];
    recommendations = recommendations.filter((rec) => {
        if (watchedSet.has(rec)) {
            watchedRecs.push(rec);
            return false;
        }
        else {
            return true;
        }
    });

    
    let videos = await VideoModel.find({status: "complete", _id: { $nin: watchedVids }}, '_id').limit(remaining);


    let array = recommendations.concat(videos.map((video) => video._id)).concat(watchedRecs);

    return array;

}

/* Test Code
async function test(username, itemId) {
    let recs = await generateVideoArrayVideoBased(username, itemId);
    console.log(recs);
    process.exit(0);
}

try {
    test("testuser1", "cf5699d27ba45192");
}
catch (err) {
    console.log('Error testing: ' + err);
}
*/

export { generateVideoArray, generateVideoArrayVideoBased };