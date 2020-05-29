const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let photoSchema = new Schema({
  username: String,
  email: String,
  thumbnail: String,
  photoURL: String
});



module.exports = mongoose.model("photos", photoSchema);