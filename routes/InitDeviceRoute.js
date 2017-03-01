var express = require('express');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var bodyParser = require('body-parser');
var basicAuthentication = require('../BasicAuthentication');
var RegisterDevices = require('../models/RegisterDevices');
var DeviceLocations = require('../models/DeviceLocations');
var async = require('async');
var AuthMiddeWare = require('./AuthMiddeWare');
var moment = require('moment');
var cors = require('cors');


var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var router = express.Router();
router.use(cors());
router.use(basicAuthentication.basicAuth());
router.use('/ChangeDeviceState', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});
//.../InitDeviceRoute/

router.post('/ChangeDeviceState', jsonParser, function (req, res) {
    var body = req.body;
    var imei = body.imei;
    var status = body.status;
    var user = req.decoded.data;

    RegisterDevices.update({ imei: imei }, {
        $set: {
            status: status, userApproval: user, approvalAt: moment()
        }
    }, function (err) {
        if (err) {
            console.log(err);
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        }
    });
});


router.post('/GetRegisterDevice', urlencodedParser, function (req, res) {

    RegisterDevices.find({}).sort({ status: 1 }).exec(function (err, docs) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            responseObject.data = docs;
            res.status(200).send(responseObject);
        }
    });

});

router.post('/RegisterDevice', jsonParser, function (req, res) {

    var body = req.body;
    var imei = body.imei;
    var manufacture = body.manufacture;
    var deviceName = body.deviceName;

    var registerDevice = new RegisterDevices({
        imei: imei,
        manufacture: manufacture,
        deviceName: deviceName,
        status: 0 // trang thai init ( dang cho duyet )
    });
    registerDevice.save({}, function (err) {
        if (err) {

            if (err.code === 11000) {
                //duplicate key
                RegisterDevices.findOne({ imei: imei }, function (err, doc) {
                    if (err) {
                        var responseObject = cf.buildResponse(responseCode.ERROR, err);
                        res.status(200).send(responseObject);
                    } else {
                        var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                        //Tim kiem xem da add dien thoai vao marker hay chua
                        DeviceLocations.findOne({ imei: doc.imei }, function (err, docDeviceLocation) {
                            if (err) {
                                var responseObject = cf.buildResponse(responseCode.ERROR, err);
                                res.status(200).send(responseObject);
                            } else {
                                if (docDeviceLocation) {
                                    var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                                    responseObject.markerId = docDeviceLocation.markerId;
                                    responseObject.name = docDeviceLocation.name;
                                    responseObject.sms = docDeviceLocation.sms;
                                    responseObject.device = doc;
                                    res.status(200).send(responseObject);
                                } else {
                                    var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                                    responseObject.markerId = '';
                                    responseObject.name = '';
                                    responseObject.device = doc;
                                    res.status(200).send(responseObject);
                                }
                            }
                        });

                    }
                });
            } else {
                var responseObject = cf.buildResponse(responseCode.ERROR, err);
                res.status(200).send(responseObject);
            }
        } else {
            RegisterDevices.findOne({ imei: imei }, function (err, doc) {
                if (err) {
                    var responseObject = cf.buildResponse(responseCode.ERROR, err);
                    res.status(200).send(responseObject);
                } else {
                    var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                    responseObject.device = doc;
                    res.status(200).send(responseObject);
                }
            });

        }
    });

});

module.exports = router;