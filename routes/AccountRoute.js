var express = require('express');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var encryption = require('../helpers/Encryption');
var cors = require('cors');
var Admins = require('../models/Admins')
var moment = require('moment');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var AuthMiddeWare = require('./AuthMiddeWare');
var basicAuthentication = require('../BasicAuthentication');

var router = express.Router();
router.use(cors());
router.use(basicAuthentication.basicAuth());
router.use('/', function (req, res, next) {
    AuthMiddeWare.AuthMiddeware(req, res, next);
});

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//Route:  /Account/
router.post('/ChangePassword', jsonParser, function (req, res) {
    var decoded = req.decoded;
    var body = req.body;
    var username = decoded.data;
    var oldPassword = body.oldPassword;
    var newPassword = body.newPassword;

    //check password
    Admins.find({ userId: username, password: encryption.encypt(oldPassword) }, function (err, docs) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            if (docs.length > 0) {
                Admins.update({ userId: username }, { $set: { password: encryption.encypt(newPassword) } }, function (err) {
                    if (err) {
                        var responseObject = cf.buildResponse(responseCode.ERROR, err);
                        res.status(200).send(responseObject);
                    } else {
                        var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                        res.status(200).send(responseObject);
                    }
                });
            } else {
                var responseObject = cf.buildResponse(responseCode.ERROR, 'Password validate failed');
                res.status(200).send(responseObject);
            }

        }
    });
});

router.post('/CheckPassword', jsonParser, function (req, res) {
    var decoded = req.decoded;
    var body = req.body;
    var username = decoded.data;
    var oldPassword = body.oldPassword;
    //check password
    Admins.find({ userId: username, password: encryption.encypt(oldPassword) }, function (err, docs) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            if (docs.length > 0) {
                var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
                res.status(200).send(responseObject);
            } else {
                var responseObject = cf.buildResponse(responseCode.ERROR, 'Password validate failed');
                res.status(200).send(responseObject);
            }

        }
    });
});

module.exports = router;