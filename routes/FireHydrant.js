var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var cors = require('cors'); //Cross domain request, using cors to make request from domain to another domain, cors is required for all backendservices
var AuthMiddeWare = require('./AuthMiddeWare');
var FireHydrant = require('../models/FireHydrant');

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
        fireHydrantId: body.fireHydrantId,
        name: body.name,
        address: body.address,
        desc: body.desc,
        lat: body.lat,
        long: body.long,
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

module.exports = router;