const express = require("express");
const AWS = require('aws-sdk');
var s3 = require('s3');
const fileUpload = require('express-fileupload');
const app = express();
const port = process.env.PORT || 8080;
const mongoose = require("mongoose");
const passport = require("passport");
const signale = require('signale');
const flash = require("connect-flash");
const morgan = require("morgan");
var ffmpeg = require("ffmpeg");
var cors = require('cors');
const fs = require("fs")
const Sentry = require('@sentry/node');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const User = require("./models/user.model");
var keys = require('./config/keys');
const Photo = require("./models/photos.model");
const dbConfig = require("./config/database.config");
const stripe = require('stripe')('sk_test_zMLclFRUPJiYNNpVp2agy2lw00dViSI4Ob');
Sentry.init({ dsn: 'https://5d34f85116544e8fb06ec776f973e3a3@o195352.ingest.sentry.io/5256839' });
var mixpanel = require('mixpanel-browser');
require('dotenv').config();
mixpanel.init("a325819221b5aff534fc0caa5dff7892");
// Configuration
mongoose.connect(dbConfig.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
require("./config/passport.config")(passport, stripe, mixpanel);

// Express setup
app.use(morgan("dev"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/public"));

// Creating S3 client
var client = s3.createClient({
	maxAsyncS3: 20, // this is the default 
	s3RetryCount: 3, // this is the default 
	s3RetryDelay: 1000, // this is the default 
	multipartUploadThreshold: 20971520, // this is the default (20 MB) 
	multipartUploadSize: 15728640, // this is the default (15 MB) 
	s3Options: {
		// Using the keys from our AWS IAM user
		accessKeyId: process.env.AWSID,
		secretAccessKey: process.env.AWSECRET,
		
		// any other options are passed to new AWS.S3() 
		// See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
	},
});
  // This is Express.js middleware to parse and handle the files we upload from our HTML page
  app.use(fileUpload());



// Passport setup
app.use(session({
  secret: "margherita",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// Routes
require("./routes/routes")(app, passport, User, stripe, Photo, AWS, fs, signale, path, fileUpload, s3, keys, client);

// Launch server
app.listen(port, () => signale.success(`Server Started on Port ${port}`));