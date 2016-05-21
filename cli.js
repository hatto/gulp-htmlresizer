#!/usr/bin/env node

const fs            = require('fs'),
    htmlImageResize = require('./index.js'),
    html            = fs.readFileSync(process.argv[2]),
    images          = htmlImageResize(process.argv[2])
;
// console.log(images);
