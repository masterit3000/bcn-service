var express = require('express');
var app = express();
var config = require('./config');
var responseCode = require('./ResponseCode');
var cf = require('./helpers/CF');
var io = require('socket.io')(config.socketPort);
var DeviceLocations = require('./models/DeviceLocations');
var FireHistory = require('./models/FireHistory');
var AdminFollowArea = require('./models/AdminFollowArea');
var mongoose = require('mongoose');
var cors = require('cors');
var async = require('async');
var crud = require('./helpers/crud');
var multer = require('multer');
var _ = require('lodash');

app.use(cors());

//Allow get request to public folder
app.use(express.static('public'));

var db = mongoose.connection;

db.on('connecting', function () {
    console.log('connecting to MongoDB...');
});

db.on('error', function (error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});
db.on('connected', function () {
    console.log('MongoDB connected!');
});
db.once('open', function () {
    console.log('MongoDB connection opened!');
});
db.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});
db.on('disconnected', function () {
    console.log('MongoDB disconnected!');
    mongoose.connect(config.database, { server: { auto_reconnect: true } });
});

mongoose.connect(config.database, { server: { auto_reconnect: true } });
mongoose.Promise = global.Promise;

crud.connect(config.database, function (err) {
    if (err) throw err;
    console.log('Mongo CRUD Connected');
});

var adminRoute = require('./routes/AdminRoute');
app.use('/Admin', adminRoute)

var commonRoute = require('./routes/CommonRoute');
app.use('/Common', commonRoute)

var fireHistoryRoute = require('./routes/FireHistoryRoute');
app.use('/FireHistory', fireHistoryRoute)

var initDeviceRoute = require('./routes/InitDeviceRoute');
app.use('/InitDeviceRoute', initDeviceRoute)

var areasRoute = require('./routes/AreasRoute');
app.use('/Area', areasRoute)

var mainMapRoute = require('./routes/MainMapRoute');
app.use('/MainMap', mainMapRoute);

var deviceRoute = require('./routes/DeviceRoute');
app.use('/DeviceRoute', deviceRoute);

var sysLog = require('./routes/SysLog');
app.use('/SysLog', sysLog);

var accountRoute = require('./routes/AccountRoute');
app.use('/Account', accountRoute);


var fireHydrant = require('./routes/FireHydrant');
app.use('/FireHydrant', fireHydrant);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    console.log('client connected: ' + socket.id);

    socket.on('AndroidConnected', function (data) {
        //Save isOnline status to MongoDB
        DeviceLocations.findOneAndUpdate({ markerId: data.MarkerId },
            { $set: { isOnline: true, socketId: socket.id, isFire: data.isFire } }, function (err, doc) {
                if (err) {
                    console.log("Something wrong when updating data!");
                } else {
                    io.emit('DeviceConnected', data.MarkerId);
                }
            });
    });

    socket.on('AndroidDisconnected', function (data) {
        DeviceLocations.findOneAndUpdate({ markerId: data.MarkerId }, { $set: { isOnline: false, socketId: '' } }, function (err, doc) {
            if (err) {
                console.log("Something wrong when updating data!");
            } else {
                //Emit to web client
                io.emit('DeviceDisconnected', data.MarkerId);
            }
        });
    });

    socket.on('AndroidFireStateChanged', function (data) {
        DeviceLocations.findOneAndUpdate({ markerId: data.MarkerId }, { $set: { isOnline: true, isFire: data.isFire } }, function (err, doc) {
            if (err) {
                console.log("Something wrong when updating data!");
            } else {
                //Emit to web client
                var json = new Object();
                json.MarkerId = data.MarkerId;
                json.isFire = data.isFire;
                json.doc = doc;


                if (data.isFire) {
                    async.waterfall([
                        function (callback) {
                            //get marker detail
                            DeviceLocations.findOne({ markerId: data.MarkerId }, function (err, deviceLocation) {
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
                                note: ''
                            });
                            fireHistory.save({}, function (err, doc) {
                                if (err) {
                                    callback(true, err);
                                } else {
                                    callback(null, doc);
                                }
                            });

                        }
                    ], function (err, result) {
                        json.fireHistoryId = result._id;
                        io.emit('DeviceFireStateChanged', json);
                    });
                } else {
                    io.emit('DeviceFireStateChanged', json);
                }
            }
        });

    });

    socket.on('disconnect', function () {
        //Search in DeviceLocations 
        DeviceLocations.update({ socketId: socket.id }, { $set: { isOnline: false } }, function (err) {
            if (err) {

            } else {

            }
        });
        console.log('Client has disconnected to the server! ' + socket.id);
        //emit to web 
        DeviceLocations.find({}, function (err, docs) {
            if (err) {
                res.send(err);
            } else {
                io.emit('DeviceDisconnected', docs);
            }
        });
    });
});

// app.get('/ListDevices/:username', function (req, res) {
//     //Lay cac area ma user duoc phep

//     AdminFollowArea.find({ userId: req.body.username }, function (err, docs) {
//         if (err) {

//         } else {

//         }
//     });

//     DeviceLocations.find({}, function (err, docs) {
//         if (err) {
//             res.send(err);
//         } else {
//             res.send(docs);
//         }
//     });
// });


//File upload module
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/DeviceThumb/')
    },
    filename: function (req, file, cb) {
        if (_.endsWith(file.mimetype, 'jpeg')) {
            cb(null, new Date().getTime() + ".jpeg");
        } else if (_.endsWith(file.mimetype, 'jpg')) {
            cb(null, new Date().getTime() + ".jpg");
        } else if (_.endsWith(file.mimetype, 'png')) {
            cb(null, new Date().getTime() + ".png");
        } else if (_.endsWith(file.mimetype, 'gif')) {
            cb(null, new Date().getTime() + ".gif");
        }
    }
});

var upload = multer({ storage: storage }).array('files', 2);

app.post('/DeviceRoute/PhotoUpload', function (req, res, next) {
    var bigRes = res;
    upload(req, res, function (err) {
        if (err) {
            var responseObject = cf.buildResponse(responseCode.ERROR, err);
            bigRes.status(200).send(responseObject);
        } else {
            var responseObject = cf.buildResponse(responseCode.SUCCESS, 'Success');
            responseObject.files = req.files[0].filename;
            bigRes.status(200).send(responseObject);
        }
    });
});

app.listen(config.servicePort);