//
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//
module.exports = mongoose.model('FireHistory', new Schema({
    markerId: String,
    name: String,
    address: String,
    phone: String,
    lat: Number,
    long: Number,
    fireDate: { type: Date, default: Date.now },
    note: String
}));
