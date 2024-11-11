import RatingModel from '../models/Rating.js';
import UserModel from '../models/User.js';
import VideoModel from '../models/Video.js';
import mongoose from 'mongoose';
import { Recommender } from 'disco-rec';

//Connect to the database
mongoose.connect('mongodb://localhost:27017/CSE356');

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

//Generate a video queue for a given user
const generateVideoStack = async (username) => {
    
    const data = await buildFeedbackArray();
    const recommender = new Recommender();
    recommender.fit(data);

    let user = await UserModel.findOne({ username: username });

    //Everything recommended by the recommender goes on top of the stack,
    //Then unwatched videos,
    //Then finally watched videos.

    let videos = await VideoModel.find({}, '_id');
    let recommendations = recommender.userRecs(username);
    let watchedVids = await RatingModel.find({ user: user._id });
    watchedVids = watchedVids.map((vid) => vid.video);

    let set = new Set();
    for(let rec of recommendations) {
        set.add(rec.itemId);
    }
    for(let watched of watchedVids) {
        set.add(watched);
    }

    console.log(set);

    videos = videos.filter((video) => !set.has(video._id));

    console.log(videos);

    let stack = watchedVids.concat(videos);

    while(recommendations.length > 0) {
        stack.push({ _id: recommendations.pop().itemId });
    }

    return stack;

}

export default generateVideoStack;