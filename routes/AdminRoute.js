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
var Client = require("emailjs/smtp/client");

var AuthMiddeWare = require('./AuthMiddeWare');
var _ = require('lodash');
var router = express.Router();
router.use(cors());

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//Route:  /Admin/
router.post('/CreateUser', jsonParser, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var name = req.body.name;
    var email = req.body.email;
    var avatar = req.body.avatar;

    var admin = new Admins({
        userId: username,
        password: encryption.encypt(password),
        name: name,
        email: email,
        avatar: avatar
    });
    admin.save(function (err) {
        if (err) {
            res.send(cf.buildResponse(responseCode.ERROR, 'Create User failed'));
        } else {
            res.send(cf.buildResponse(responseCode.SUCCESS, 'Create User success'));
        }
    });
});

router.post('/Login', jsonParser, function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    Admins.findOne({ userId: username, password: encryption.encypt(password) }, function (err, person) {
        if (err) {
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Sai tên đăng nhập hoặc mật khẩu'));
        }
        else {
            if (person) {
                var token = jwt.sign({
                    data: username
                }, config.jwtKey, { expiresIn: config.jwtSessionExpiresTime });
                var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Đăng nhập thành công');

                responseObject.token = token;
                responseObject.username = person.username;
                responseObject.name = person.name;
                responseObject.email = person.email;
                responseObject.avatar = person.avatar;
                responseObject.createdAt = person.created_at;
                responseObject.memberSince = moment(person.created_at).format("MMM YYYY");

                res.status(200).send(responseObject);
            }
            else {
                res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Sai tên đăng nhập hoặc mật khẩu'));
            }
        }
    })
});

router.post('/ForgetPassword', jsonParser, function (req, res) {
    var email = req.body.email;
    Admins.find({ email: email }, function (err, persons) {
        if (err) {
            res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Không tìm thấy email trong hệ thống'));
        }
        else {
            if (_.size(persons) === 0) {
                res.status(200).send(cf.buildResponse(responseCode.ERROR, 'Không tìm thấy email trong hệ thống'));
            } else {
                var oldPassword = encryption.decypt(persons[0].password);

                var server = Client.connect({
                    user: config.senderEmail,
                    password: config.senderEmailPassword,
                    host: config.smtpServer,
                    ssl: config.isUsingSSL
                });

                // send the message and get a callback with an error or details of the message that was sent
                server.send({
                    text: "Mật khẩu của bạn: " + oldPassword,
                    from: config.senderFromName,
                    to: email,
                    subject: "Thay đổi mật khẩu"
                }, function (err, message) { console.log(err || message); });

                var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Hệ thống đã gửi mật khẩu vào email bạn');
                res.status(200).send(responseObject);
            }

        }
    })
});



module.exports = router;