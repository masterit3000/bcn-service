/**
 * ThanhND
 * Register device table ( when a application installed, save imei to This table, admin has to approve)
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
//
module.exports = mongoose.model('RegisterAndroidDevice', new Schema({
    imei: { type: String, index: { unique: true } },
    manufacture: String,
    deviceName: String,
    status: Number, // 0 - moi dang ky ; 1 - da duoc phe duyet ; 2 - khong duoc phe duyet ; 3 - Da duoc assign
    createdAt: { type: Date, default: Date.now },
    userApproval: String,
    approvalAt: Date
}));
