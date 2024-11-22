import RatingModel from '../models/Rating.js';
import UserModel from '../models/User.js';
import VideoModel from '../models/Video.js';
import mongoose from 'mongoose';
import { Recommender } from 'disco-rec';

import dotenv from 'dotenv';
dotenv.config();
const mongoURI = process.env.MONGOURI;


//Connect to the database
mongoose.connect("mongodb://admin:cse356cpdbp@anthonysgroup.cse356.compas.cs.stonybrook.edu/CSE356?authSource=admin").catch((err) => {
    console.log('Could not connect to DB: ' + err);
});

//Build the rating matrix from all the users and their ratings on all the videos
//TODO: Schedule this with CRON instead, this is very computationally expensive
const buildFeedbackArray = async () => {

    let feedback = [];
    let ratings = await RatingModel.find();
    for (let rating of ratings) {
        let user = await UserModel.findOne({ _id: rating.user });
        let video = await VideoModel.findOne({ _id: rating.video });
        console.log('Mongo time test');
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

//Generate a video array for a given user. Similar videos are first, followed by recommendations, followed by unwatched videos, followed by watched videos.
const generateVideoArray = async (username, itemId = null) => {
    
    const data = await buildFeedbackArray();
    let recommendations = [];
    let similarItems = [];
    if (data.length > 0) {
        const recommender = new Recommender();
        recommender.fit(data);
        if (itemId) {
            similarItems = recommender.itemRecs(itemId);
        }

        recommendations = recommender.userRecs(username);
    }

    let user = await UserModel.findOne({ username: username });

    //Everything recommended by the recommender goes first,
    //Then unwatched videos,
    //Then finally watched videos.

    let videos = await VideoModel.find({status: "complete"}, '_id');
    let watchedVids = user.watchHistory;

    let array = new Array();
    let watchedSet = new Set(watchedVids);
    let similarSet = new Set(similarItems);

    //If recommendations contain watched videos, remove them and add them to front of watchedVids
    recommendations = recommendations.filter((rec) => {
        if (watchedSet.has(rec.itemId)) {
            watchedVids.unshift(rec.itemId);
            return false;
        }
        //Remove videos in recommendations that are already present in similarItems to prevent duplicates
        else if (similarSet.has(rec.itemId)) {
            return false;
        }
        else {
            return true;
        }
    });

    //If similarItems contain watched videos, remove them and add them to front of watchedVids
    similarItems = similarItems.filter((rec) => {
        if (watchedSet.has(rec.itemId)) {
            watchedVids.unshift(rec.itemId);
            return false;
        }
        else {
            return true;
        }
    });


    for(let rec of recommendations) {
        watchedSet.add(rec.itemId);
    }
    for(let rec of similarItems) {
        watchedSet.add(rec.itemId);
    }

    videos = videos.filter((video) => !watchedSet.has(video._id));

    array = similarItems.map((rec) => rec.itemId);
    array = array.concat(recommendations.map((rec) => rec.itemId));
    array = array.concat(videos.map((video) => video._id));
    array = array.concat(watchedVids);

    return array;
}

export default generateVideoArray;