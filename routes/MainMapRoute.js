var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var cors = require('cors'); //Cross domain request, using cors to make request from domain to another domain, cors is required for all backendservices
var mongoCrud = require('../helpers/crud');
var AuthMiddeWare = require('./AuthMiddeWare');
var DeviceLocations = require('../models/DeviceLocations');
var AdminFollowArea = require('../models/AdminFollowArea');


var _ = require('lodash');

var router = express.Router();

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//localhost:8898/MainMap
router.use(cors());

router.use('/', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

router.get('/ListDevices', function (req, res) {
    //Lay cac area ma user duoc phep
    AdminFollowArea.find({ userId: req.decoded.data }, 'areaId', function (err, docs) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var arrAreaId = [];

            _.forEach(docs, function (value) {
                arrAreaId.push(value.areaId)
            });

            DeviceLocations.find({ area: { "$in": arrAreaId } }, function (err, docs2) {

                if (err) {
                    var responseObject = cf.buildResponse(responseCode.ERROR, err);
                    res.status(200).send(responseObject);
                } else {
                  
                    var responseObject2 = cf.buildResponse(responseCode.SUCCESS, 'Success');
                    responseObject2.data = docs2;
                    res.status(200).send(responseObject2);
                }
            });
        }
    });


});

module.exports = router;