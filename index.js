const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const localRouter = require('./Routes/local').localRouter;
let getHost = require('./Routes/local').getHost;
const remoteRouter = require('./Routes/remote').remoteRoute;


var local = express();
var remote = express();

local.use(express.static('static'));
local.use(bodyParser.urlencoded({extended:false}));
local.use(session({
    secret:'Sanket Dhole',
    resave:false,
    saveUninitialized:false,
}));
local.set('view engine','pug');
local.set('views','./views');

remote.use(bodyParser.urlencoded({extended:false}));

//Local Router in Router/local.js
local.use(localRouter);
//Remote Router in Router/remote.js
remote.use(remoteRouter);


local.listen(3000,'localhost');
remote.listen(3001,'0.0.0.0');