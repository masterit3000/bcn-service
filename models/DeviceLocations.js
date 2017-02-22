//
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//
module.exports = mongoose.model('DeviceLocations', new Schema({
    markerId: { type: String, unique: true },
    name: String,
    address: String,
    phone: String,
    lat: Number,
    long: Number,
    isFire: {type: Boolean, default: false},
    isOnline: {type: Boolean, default: false},
    socketId: String,
    imei: String, //connected with phone's imei
    desc: String,
    area: String,
    areaName: String
}));
