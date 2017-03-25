var express = require('express');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var encryption = require('../helpers/Encryption');
var cors = require('cors');
var moment = require('moment');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var AuthMiddeWare = require('./AuthMiddeWare');
var SysLog = require('../models/SysLog')
var basicAuthentication = require('../BasicAuthentication');

var router = express.Router();
router.use(cors());
router.use(basicAuthentication.basicAuth());
router.use('/', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//Route:  /SysLog/

router.get('/GetSysLog', function (req, res) {
    console.log('zo');
    SysLog.find({}, function (err, docs) {
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

router.post('/InsertSysLog', jsonParser, function (req, res) {

    var body = req.body;
    var type = body.type;
    var desc = body.desc;

    var sysLog = new SysLog({
        type: type,
        desc: desc
    });

    sysLog.save({}, function (err) {
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