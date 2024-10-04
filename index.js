
const express = require('express');
const path = require('path');

const app = express();

const PORT = 8080;

//Add custom header
app.use((req, res, next) => {
    res.header('X-CSE356', '66d155ec7f77bf55c50044bf');
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});


app.listen(PORT);
console.log(`Server is running on port ${PORT}`);
