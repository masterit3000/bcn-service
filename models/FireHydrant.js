//
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//
module.exports = mongoose.model('FireHydrant', new Schema({
    fireHydrantId: Number,
    name: String,
    address: String,
    desc: String,
    lat: Number,
    long: Number,
}));
