var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var cors = require('cors'); //Cross domain request, using cors to make request from domain to another domain, cors is required for all backendservices
var AuthMiddeWare = require('./AuthMiddeWare');
var FireHydrant = require('../models/FireHydrant');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');

var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//localhost:8898/FireHydrant
router.use(cors());

router.use('/', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

router.get('/GetFireHyrant', function (req, res) {
    FireHydrant.find({}, function (err, docs) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, 'message');
            res.status(500).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            responseObject.data = docs;
            res.status(200).send(responseObject);
        }
    });
});

router.post('/InsertFireHydrant', jsonParser, function (req, res) {
    var body = req.body;

    var fireHydrant = new FireHydrant({
        name: body.name,
        address: body.address,
        desc: body.desc,
        lat: body.lat,
        long: body.long,
		areaid:body.areaid
    });

    fireHydrant.save({}, function (err) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, 'message');
            res.status(500).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        }
    });
});

function getDistanceFromLatLonInMet(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c * 1000; // Distance in m
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

router.post('/NearByFireHydrant', jsonParser, function (req, res) {
    async.waterfall([
        function (callback) {
            FireHydrant.find({}, function (err, docs) {
                if (err) {
                    callback(true, err);
                } else {
                    callback(null, docs);
                }
            });
        },
        function (docs, callback) {
            //Get by id
            var nearByPlaces = [];
            _.forEach(docs, function (doc) {
                var distanceInMet = getDistanceFromLatLonInMet(doc.lat, doc.long, req.body.lat, req.body.long);

                if (distanceInMet <= req.body.distance) {
                    var clonedDoc = {};
                    clonedDoc.name = doc.name;
                    clonedDoc.address = doc.address;
                    clonedDoc.desc = doc.desc;
                    clonedDoc.lat = doc.lat;
                    clonedDoc.long = doc.long;
                    clonedDoc.distance = Math.floor(distanceInMet) + ' m';
                    nearByPlaces.push(clonedDoc);
                }
            });
            callback(null, nearByPlaces);
        }
    ], function (err, result) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            responseObject.data = result;
            res.status(200).send(responseObject);
        }
    });


});

router.post('/UpdateFireHydrant', jsonParser, function (req, res) {
    var body = req.body;
    FireHydrant.update({ _id: ObjectID(body.id) }, {
        $set: {
            name: body.name,
            address: body.address,
            desc: body.desc,
            lat: body.lat,
            long: body.long,
			areaid:body.areaid
        }
    }, function (err) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        }
    });
});

module.exports = router;