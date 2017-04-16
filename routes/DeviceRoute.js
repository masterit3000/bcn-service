var express = require('express');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var bodyParser = require('body-parser');
var basicAuthentication = require('../BasicAuthentication');
var async = require('async');
var AuthMiddeWare = require('./AuthMiddeWare');
var moment = require('moment');
var cors = require('cors');
var DeviceLocations = require('../models/DeviceLocations');
var DeviceLogs = require('../models/DeviceLogs');
var axios = require('axios');
var Indexing = require('../models/Indexing');
var async = require('async');
var _ = require('lodash');
var RegisterDevices = require('../models/RegisterDevices');
var multer = require('multer');
var Customers = require('../models/Customers');

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var router = express.Router();
router.use(cors());
router.use(basicAuthentication.basicAuth());
router.use(bodyParser.json({ limit: '50mb' }));

//.../DeviceRoute/

//Request tu Android -> neu day usb bi thao
router.post('/DevicePowerCordStateChanged', jsonParser, function (req, res) {
    var body = req.body;
    var imei = body.imei;
    var status = body.status;

    DeviceLocations.update({ imei: imei }, { $set: { powerCordState: status === 1 ? true : false } }, function (err) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            console.log('zo');
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        }
    });
});

//Request tu Android -> neu day headset bi thao
router.post('/DeviceHeadSetPlug', jsonParser, function (req, res) {
    var body = req.body;
    var imei = body.imei;
    var status = body.status;

    DeviceLocations.update({ imei: imei }, { $set: { headSetState: status === 1 ? true : false } }, function (err) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            console.log('zo');
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        }
    });
});

//Request tu Android -> Luu log
router.post('/InsertDeviceLog', jsonParser, function (req, res) {
    var body = req.body;
    var imei = body.imei;
    var markerId = body.markerId;
    var markerName = body.markerName;
    var logType = body.logType;
    var logDesc = body.logDesc;
    var logDate = body.logDate;
    console.log(body);
    var deviceLogs = new DeviceLogs({
        imei: imei,
        markerId: markerId,
        markerName: markerName,
        logType: logType,
        logDesc: logDesc,
        logDate: logDate
    });

    deviceLogs.save({}, function (err) {

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

router.use('/GetDeviceLogs', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

router.post('/GetDeviceLogs', jsonParser, function (req, res) {

    var markerId = req.body.markerId;

    DeviceLogs.find({ markerId: markerId }, null, { sort: { logDate: -1 } }, function (err, docs) {
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

router.use('/InsertDeviceLogFromWeb', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

//Request tu Web -> Luu log ( cho trang thai connect & disconnect )
router.post('/InsertDeviceLogFromWeb', jsonParser, function (req, res) {
    var body = req.body;
    var markerId = body.markerId;
    var logType = body.logType;
    var logDesc = body.logDesc;
    var logDate = (new Date).getTime();

    //Lay imei va marker name theo markerId
    DeviceLocations.findOne({ markerId: markerId }, function (err, doc) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var imei = doc.imei;
            var markerName = doc.markerName;
            var deviceLogs = new DeviceLogs({
                imei: imei,
                markerId: markerId,
                markerName: markerName,
                logType: logType,
                logDesc: logDesc,
                logDate: logDate
            });

            deviceLogs.save({}, function (err) {
                if (err) {
                    var responseObject = cf.buildResponse(responseCode.ERROR, err);
                    res.status(200).send(responseObject);
                } else {
                    var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                    res.status(200).send(responseObject);
                }
            });
        }
    });
});

//Request tu web -> lay chi tiet marker theo markerId
router.use('/GetMarkerById', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});
router.post('/GetMarkerById', jsonParser, function (req, res) {
    var markerId = req.body.markerId;

    DeviceLocations.findOne({ markerId: markerId }, function (err, doc) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            responseObject.data = doc;
            res.status(200).send(responseObject);
        }
    });
});

//Request tu Web -> Lay danh sach dia diem xung quanh ( near by locations )
router.use('/GetNearByPlaces', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

router.post('/GetNearByPlaces', jsonParser, function (req, res) {

    instance.post('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.8670522,151.1957362&radius=500&type=restaurant&keyword=cruise&key=AIzaSyC7YYt-t9Jw_Bv7IruMS-ZlDTCxyUN0mwQ').then(function (response) {
        console.log(response);
        var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
        responseObject.data = response;
        res.status(200).send(responseObject);
    });
});

router.post('/GetDeviceId', jsonParser, function (req, res) {
    var body = req.body;
    var prefix = body.prefix;

    async.waterfall([
        function (callback) {
            //Kiem tra xem da insert device = 0 chua
            Indexing.count({ type: 'DEVICE' }, function (err, count) {
                if (!err) {
                    if (count === 0) {
                        var indexing = new Indexing({
                            type: 'DEVICE',
                            seq: 0
                        });
                        indexing.save({}, function (err) {
                            if (!err) {
                                callback(null);
                            } else {
                                callback(true, err);
                            }
                        });
                    } else {
                        callback(null);
                    }
                }
            });
        },
        function (callback) {
            //Lay ve id 
            Indexing.findOne({ type: 'DEVICE' }, function (err, doc) {
                if (err) {
                    callback(true, err);
                } else {
                    var seq = doc.seq + 1;
                    var id = prefix + _.padStart(_.toString(seq), 4, '0');
                    callback(null, id);
                }
            });
        }
    ], function (err, result) {
        if (!err) {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            responseObject.id = result;
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.ERROR, 'Error');
            responseObject.id = '';
            res.status(200).send(responseObject);
        }

    });


});


router.post('/InsertDeviceLocation', jsonParser, function (req, res) {

    var body = req.body;
    var areaName = "";
    var prefix = body.shortName;

    async.waterfall([
        function (callback) {
            //Kiem tra xem da insert device = 0 chua
            Indexing.count({ type: 'DEVICE' }, function (err, count) {
                if (!err) {
                    if (count === 0) {
                        var indexing = new Indexing({
                            type: 'DEVICE',
                            seq: 0
                        });
                        indexing.save({}, function (err) {
                            if (!err) {
                                callback(null);
                            } else {
                                callback(true, err);
                            }
                        });
                    } else {
                        callback(null);
                    }
                }
            });
        },
        function (callback) {
            //Lay ve id 
            Indexing.findOne({ type: 'DEVICE' }, function (err, doc) {
                if (err) {
                    callback(true, err);
                } else {
                    var seq = doc.seq + 1;
                    var id = prefix + _.padStart(_.toString(seq), 4, '0');
                    callback(null, id, seq);
                }
            });
        },
        function (id, seq, callback) {
            //Update lai indexing tang them 1
            Indexing.update({ type: 'DEVICE' }, { $set: { seq: seq } }, function (err) {
            });
            //Nhay xuong luon ko cho update
            callback(null, id);
        }
        ,
        function (id, callback) {
            console.log(id);
            //Luu databases
            var deviceLocation = DeviceLocations({
                markerId: id,
                name: body.name,
                address: body.address,
                phone: body.phone,
                lat: body.lat,
                long: body.long,
                imei: body.imei,
                desc: body.desc,
                area: body.area,
                areaName: body.areaName,
                sms: body.sms,
                thongTinCoSo: body.thongTinCoSo,
                thumbImg: body.thumbImg
            });
            deviceLocation.save({}, function (err) {
                if (err) {
                    callback(true, err);
                } else {
                    callback(null);
                }
            });
			Customers.findOne({ phoneNumber: body.phone}, function (err, person) {
				if (err) {
					res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Ket noi db co van de'));
				}
				else {
					if (!person) {
					   var cus= Customers({
						phoneNumber: body.phone,
						password: '831edddb5584ca2c1345c41a32c27f86',
						name: body.name,
						
						
					});
					}
					
				}
			})
			
			
        },

        function (callback) {
            //Update lai trang thai cua Android devices ve da su dung
            RegisterDevices.update({ imei: body.imei }, { $set: { status: 2 } }, function (err2) {
                if (err2) {
                    callback(true, err2);
                } else {
                    callback(null, '');
                }
            });
        },

    ], function (err, result) {
        if (!err) {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.ERROR, 'Error');
            res.status(200).send(responseObject);
        }

    });



});



module.exports = router;