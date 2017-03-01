var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var cors = require('cors'); //Cross domain request, using cors to make request from domain to another domain, cors is required for all backendservices
var mongoCrud = require('../helpers/crud');
var AuthMiddeWare = require('./AuthMiddeWare');
var DeviceLocations = require('../models/DeviceLocations');
var RegisterDevices = require('../models/RegisterDevices');
var _ = require('lodash');
var ObjectID = require('mongodb').ObjectID;
var router = express.Router();

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//localhost:8898/Common
router.use(cors());

router.use('/', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

router.post('/GetData', urlencodedParser, function (req, res) {
    var table = req.body.table;
    mongoCrud.retrieve(table, function (err, result) {
        if (err) {
            console.log(err);
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Load ' + table + ' error'));
        }
        else {
            var responseObj = cf.buildResponse(responseCode.SUCCESS, 'Load ' + table + ' Success');
            responseObj.data = result;
            res.status(200).send(responseObj);
        }
    });
});


router.post('/FindOne', urlencodedParser, function (req, res) {
    var table = req.body.table;
    var column = req.body.column;
    var value = req.body.value;
    var findCondition = {};
    findCondition[column] = value;

    mongoCrud.retrieve(table, findCondition, function (err, result) {
        if (err) {
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Load ' + table + ' error'));
        }
        else {
            var responseObj = cf.buildResponse(responseCode.SUCCESS, 'Load ' + table + ' Success');
            responseObj.data = result;
            res.status(200).send(responseObj);
        }
    });
});


router.post('/UpdateData', jsonParser, function (req, res) {
    var table = req.body.table;
    var key = req.body.key;
    var value = req.body.value;
    var cellName = req.body.cellName;
    var cellValue = req.body.cellValue;

    var obj = Object();
    obj[key] = value;
    var isError = false;

    mongoCrud.retrieve(table, obj, function (err, result) {
        if (err) {
            isError = true;
        }
        else {

            // for each object returned perform set the property foo == block.
            for (var i = result.length - 1; i >= 0; i--) {
                var row = result[i];
                row[cellName] = cellValue;

                // save the update.
                mongoCrud.update(table, row, function (err, result) {
                    // handle any errors here.
                    if (err) {
                        isError = true;
                    }
                });
            }
        }
    });

    if (isError) {
        res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Update ' + table + ' Error'));
    } else {
        res.status(200).send(cf.buildResponse(responseCode.SUCCESS, 'Update ' + table + ' Success'));
    }

});


router.post('/UpdateDataById', jsonParser, function (req, res) {
    var table = req.body.table;
    var value = ObjectID(req.body.value);
    var cellName = req.body.cellName;
    var cellValue = req.body.cellValue;

    var obj = Object();
    obj._id = value;
    var isError = false;

    mongoCrud.retrieve(table, obj, function (err, result) {
        if (err) {
            isError = true;
        }
        else {

            // for each object returned perform set the property foo == block.
            for (var i = result.length - 1; i >= 0; i--) {
                var row = result[i];
                row[cellName] = cellValue;

                // save the update.
                mongoCrud.update(table, row, function (err, result) {
                    // handle any errors here.
                    if (err) {
                        isError = true;
                    }
                });
            }
        }
    });

    if (isError) {
        res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Update ' + table + ' Error'));
    } else {
        res.status(200).send(cf.buildResponse(responseCode.SUCCESS, 'Update ' + table + ' Success'));
    }

});

router.post('/DeleteData', jsonParser, function (req, res) {
    var table = req.body.table;
    var key = req.body.key;
    var values = req.body.values;
    var isError = false;
    for (var i = 0; i < values.length; i++) {
        var obj = Object();
        obj[key] = values[i];
        mongoCrud.delete(table, obj, function (err, result) {
            if (err) {
                isError = true;
            }
        });
    }
    if (isError) {
        res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Delete ' + table + ' Error'));
    } else {
        res.status(200).send(cf.buildResponse(responseCode.SUCCESS, 'Delete ' + table + ' Success'));
    }

});

router.post('/InsertDeviceLocation', jsonParser, function (req, res) {

    var body = req.body;
    var areaName = "";
    console.log(body.sms);

    mongoCrud.retrieve('areas', { isdeleted: false }, function (err, result) {
        if (err) {
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Load areas error'));
        }
        else {

            var deviceLocation = DeviceLocations({
                markerId: body.markerId,
                name: body.name,
                address: body.address,
                phone: body.phone,
                lat: body.lat,
                long: body.long,
                imei: body.imei,
                desc: body.desc,
                area: body.area,
                areaName: body.areaName,
                sms: body.sms
            });
            deviceLocation.save({}, function (err) {
                if (err) {
                    res.send(cf.buildResponse(responseCode.ERROR, err));
                } else {
                    RegisterDevices.update({ imei: body.imei }, { $set: { status: 2 } }, function (err2) {
                        if (err2) {
                            res.send(cf.buildResponse(responseCode.ERROR, err2));
                        } else {
                            res.send(cf.buildResponse(responseCode.SUCCESS, 'Success'));
                        }
                    });
                }
                //Cap nhat trang thai register devices

            });
        }
    });


});


module.exports = router;