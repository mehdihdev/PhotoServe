const express = require("express");
const AWS = require('aws-sdk');
var multer = require('multer');
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
const Photo = require("./models/photos.model");
const dbConfig = require("./config/database.config");
const stripe = require('stripe')('sk_test_zMLclFRUPJiYNNpVp2agy2lw00dViSI4Ob');
Sentry.init({ dsn: 'https://5d34f85116544e8fb06ec776f973e3a3@o195352.ingest.sentry.io/5256839' });
// Configuration
mongoose.connect(dbConfig.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
require("./config/passport.config")(passport, stripe);

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
require("./routes/routes")(app, passport, User, stripe, Photo, AWS, fs, signale, fileUpload);





// Launch server
app.listen(port, () => signale.success(`Server Started on Port ${port}`));