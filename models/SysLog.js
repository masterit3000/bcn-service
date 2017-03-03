//
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//Log on android devices sync with server
module.exports = mongoose.model('SysLog', new Schema({
    type: String,
    desc: String,
    date: { type: Date, default: Date.now() }
}));
