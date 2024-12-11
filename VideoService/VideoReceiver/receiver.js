const express = require('express');
const busboy = require('busboy')
const path = require('node:path');

const app = express();
PORT = 8080
let ROOT = __dirname
app.post('/',(req, res) => {

    //Body {file: file}
    
    //console.log(newuid)

    let reqBody = {}
    let fieldCount = 0
    const bb = busboy({ headers: req.headers });
    bb.on('file', function(filename, file, info) {

        let {ext} = path.parse(filename);

        let filePath;
        if(ext == '.jpg'){
            filePath = path.join(ROOT,'public', 'thumbnails',filename);
        }else{
            filePath = path.join(ROOT,'public', 'media',filename);
        }

        file.pipe(fs.createWriteStream(tempPathFile));

    });
    bb.on('finish', function() {

        res.status(200).json({status: 'OK'})
       

    });
    
    req.pipe(bb);
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});