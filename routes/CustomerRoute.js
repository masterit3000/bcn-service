var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');
var responseCode = require('../ResponseCode');
var cf = require('../helpers/CF');
var cors = require('cors');
var AuthMiddewareCustomer = require('./AuthMiddewareCustomer');
var basicAuthenticationCustomer = require('../BasicAuthenticationCustomer');
var Customers = require('../models/Customers');
var encryption = require('../helpers/Encryption');
var jwt = require('jsonwebtoken');
var DeviceLocations = require('../models/DeviceLocations');
var mongoose = require('mongoose');

var router = express.Router();
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//../Customer
router.use(cors());

router.use(basicAuthenticationCustomer.basicAuth());

router.post('/Login', jsonParser, function (req, res) {
    var body = req.body;
    var username = body.username;
    var password = body.password;
    Customers.findOne({ phoneNumber: username, password: encryption.encypt(password) }, function (err, person) {
        if (err) {
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Sai tên đăng nhập hoặc mật khẩu'));
        }
        else {
            if (person) {
                var token = jwt.sign({
                    data: username
                }, config.jwtKeyCustomer, { expiresIn: config.jwtSessionExpiresTime });
                var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Đăng nhập thành công');
                responseObject.token = token;
                responseObject.phoneNumber = person.phoneNumber;
                responseObject.name = person.name;
                responseObject.email = person.email;
                responseObject.avatar = person.avatar;
                res.status(200).send(responseObject);
            }
            else {
                res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Sai tên đăng nhập hoặc mật khẩu'));
            }
        }
    })
});

router.post('/InsertCustomer', jsonParser, function (req, res) {
    var body = req.body;
    var phoneNumber = body.phoneNumber;
    var name = body.name;
    var password = body.password;
    var name = body.name;
    var email = body.email;
    var avatar = body.avatar;

    var customer = new Customers({
        phoneNumber: phoneNumber,
        password: encryption.encypt(password),
        name: name,
        email: email,
        avatar: avatar,
    });
    customer.save({}, function (err) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            res.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            res.status(200).send(responseObject);
        }
    });
});

router.use('/Logged', function (req, res, next) {
    AuthMiddewareCustomer.AuthMiddewareCustomer(req, res, next);
});

router.get('/Logged/GetListDevices', function (req, res) {
    var decoded = req.decoded;
    DeviceLocations.find({ phone: decoded.data }, function (err, docs) {
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

router.post('/Logged/UpdateSMS', jsonParser, function (req, res) {
    var id = req.body.id;
    var sms = req.body.sms;
    var phone = req.decoded.data;
    console.log(sms);
    console.log(id);
    console.log(phone);
    DeviceLocations.update({ _id: mongoose.Types.ObjectId(id), phone: phone }, { $set: { sms: sms } }, function (err) {
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

