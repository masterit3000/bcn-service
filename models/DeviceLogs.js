//
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//Log on android devices sync with server
module.exports = mongoose.model('DeviceLog', new Schema({
    imei: String, //Save both imei & marker de phong truong hop update imei khac cho marker khac
    markerId: String,
    markerName: String,
    logType: String,
    logDesc: String,
    logDate: Number
}));
