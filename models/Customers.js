var mongoose = require("mongoose");
var Schema = mongoose.Schema;
module.exports = mongoose.model('customer', new Schema({
    phoneNumber: String,
    password: String,
    name: String,
    email: String,
    avatar: String,
}));
