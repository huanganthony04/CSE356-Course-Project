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
    console.log(feedback);
    return feedback;
}

const recommender = new Recommender();
let data = await buildFeedbackArray();
recommender.fit(data);

console.log(recommender.userRecs('testuser2'));
