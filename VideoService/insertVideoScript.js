const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const mongoURI = 'mongodb://localhost:27017/CSE356';

//Set up connection to mongo client
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'));

const populate = async () => {
    const media_path = "./../public/media";
    let videoFileArray = fs.readdirSync(factbook_path,{withFileTypes: true})
        .filter(dirent => dirent.name.slice((dirent.name.lastIndexOf(".") - 1 >>> 0) + 2) == "mp4")
        .map(direct => direct.name);


    for(const video of videoFileArray){

    }
}