const express = require('express');
const path = require('path');

const app = express();

const PORT = 3000;


// Serve all files in this folder
// index.html, style.css, script.js

app.use(
    express.static(
        path.join(__dirname)
    )
);


// Start server

app.listen(
    PORT,
    () => {

        console.log(
            `Blog running at http://localhost:${PORT}`
        );

    }
);