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


function flatternAreas(areas) {
    var arr = [];
    _.forEach(areas, function (area) {
        arr.push({ id: area.id, name: area.name, latitude: area.latitude, longitude: area.longitude });
        if (_.size(area.childs) > 0) {
            var temp = flatternAreas(area.childs);
            _.forEach(temp, function (child) {
                arr.push({ id: child.id, name: child.name, latitude: area.latitude, longitude: area.longitude });
            });

        }
    });
    return arr;
}

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
                    //tim kiem lat long mac dinh cua area dau tien ma ho theo doi
                    mongoCrud.retrieve('areas', { isdeleted: false }, function (err, result) {
                        if (err) {
                            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Load areas error'));
                        }
                        else {
                            var areasFlatterned = flatternAreas(result);
                            _.forEach(areasFlatterned, function (area) {
                                if (_.isEqual(area.id, arrAreaId[0])) {
                                    var responseObject2 = cf.buildResponse(responseCode.SUCCESS, 'Success');
                                    responseObject2.data = docs2;
                                    responseObject2.lat = area.latitude;
                                    responseObject2.long = area.longitude;

                                    res.status(200).send(responseObject2);
                                    return;
                                }
                            });
                        }
                    });


                }
            });
        }
    });
});

module.exports = router;