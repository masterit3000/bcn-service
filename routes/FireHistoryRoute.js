var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var cors = require('cors'); //Cross domain request, using cors to make request from domain to another domain, cors is required for all backendservices
var AuthMiddeWare = require('./AuthMiddeWare');
var FireHistory = require('../models/FireHistory');
var DeviceLocations = require('../models/DeviceLocations');
var RegisterDevices = require('../models/RegisterDevices');
var responseCode = require('../ResponseCode');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');

var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//localhost:8898/FireHistory
router.use(cors());

router.use('/', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

router.get('/GetFireHistory', function (req, res) {

    FireHistory.find({}).sort({ fireDate: 'desc' }).exec(function (err, docs) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(500).send(responseObject);
        } else {

            var responseObject = cf.buildResponse(responseCode.SUCCESS, docs);
            res.status(200).send(responseObject);
        }
    });
});


router.post('/GetFireHistoryByDate', jsonParser, function (req, res) {
    var fromDate = moment(req.body.fromDate, "DD/MM/YYYY");
    var toDate = moment(req.body.toDate, "DD/MM/YYYY").add('days', 1);

    FireHistory.aggregate(
        [
            {
                $match: {
                    fireDate: { $gte: new Date(fromDate), $lt: new Date(toDate) }
                }
            },
            {
                $group:
                {
                    _id: { month: { $month: "$fireDate" }, day: { $dayOfMonth: "$fireDate" }, year: { $year: "$fireDate" } },
                    total: {
                        $sum: 1
                    }
                }
            }
        ],
        function (err, docs) {
            if (err) {
                var responseObject = cf.buildResponse(responseCode.ERROR, err);
                res.status(200).send(responseObject);
            } else {
                var docsResponse = [];
                var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                _.forEachRight(docs, function (doc) {
                    docsResponse.push({ date: doc._id.day + "/" + doc._id.month + "/" + doc._id.year, "Tổng số vụ cháy": doc.total });
                });
                responseObject.data = docsResponse;
                res.status(200).send(responseObject);
            }
        }
    );
});

//Lay danh sach imei chua duoc su dung & da duoc phe duyet ( status == 1 )
router.get('/GetListUnusedImei', function (req, res) {
    RegisterDevices.find({ status: 1 }, function (err, docs) {
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

router.post('/InsertFireHistory', jsonParser, function (req, res) {
    var body = req.body;
    var markerId = body.markerId;
    var note = body.note;

    async.waterfall([
        function (callback) {
            //get marker detail
            DeviceLocations.findOne({ markerId: markerId }, function (err, deviceLocation) {
                if (err) {
                    callback(true, err);
                } else {
                    callback(null, deviceLocation);
                }
            });
        },
        function (deviceLocation, callback) {
            //Insert fire FireHistory
            var fireHistory = new FireHistory({
                markerId: deviceLocation.markerId,
                name: deviceLocation.name,
                address: deviceLocation.address,
                phone: deviceLocation.phone,
                lat: deviceLocation.lat,
                long: deviceLocation.long,
                note: note
            });
            fireHistory.save({}, function (err) {
                if (err) {
                    callback(true, err);
                } else {
                    callback(null, 'success');
                }
            });

        }
    ], function (err, result) {
        if (err) {
            res.send(cf.buildResponse(responseCode.ERROR, err));
        } else {
            res.send(cf.buildResponse(responseCode.SUCCESS, 'success'));
        }
    });


});
module.exports = router;