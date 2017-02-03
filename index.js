var express = require('express');
var app = express();
var config = require('./config');

var io = require('socket.io')(config.socketPort);
var DeviceLocations = require('./models/DeviceLocations');
var mongoose = require('mongoose');
var cors = require('cors');
app.use(cors());

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
                    //Emit to web client
                    DeviceLocations.find({}, function (err, docs) {
                        if (err) {
                            res.send(err);
                        } else {
                            io.emit('DeviceConnected', docs);
                        }
                    });
                }
            });
    });

    socket.on('AndroidDisconnected', function (data) {
        DeviceLocations.findOneAndUpdate({ markerId: data.MarkerId }, { $set: { isOnline: false, socketId: '' } }, function (err, doc) {
            if (err) {
                console.log("Something wrong when updating data!");
            } else {
                //Emit to web client
                DeviceLocations.find({}, function (err, docs) {
                    if (err) {
                        res.send(err);
                    } else {
                        io.emit('DeviceDisconnected', docs);
                    }
                });

            }
        });
    });

    socket.on('AndroidFireStateChanged', function (data) {
        DeviceLocations.findOneAndUpdate({ markerId: data.MarkerId }, { $set: { isOnline: true, isFire: data.isFire } }, function (err, doc) {
            if (err) {
                console.log("Something wrong when updating data!");
            } else {
                //Emit to web client
                DeviceLocations.find({}, function (err, docs) {
                    if (err) {
                        res.send(err);
                    } else {
                        io.emit('DeviceFireStateChanged', docs);
                        if(data.isFire){
                            io.emit('DeviceIsFire', doc);
                        }
                    }
                });

            }
        });

    });

    socket.on('disconnect', function () {
        console.log('Client has disconnected to the server!');
    });
});

app.get('/ListDevices', function (req, res) {
    DeviceLocations.find({}, function (err, docs) {
        if (err) {
            res.send(err);
        } else {
            res.send(docs);
        }
    });
});

app.get('/Create', function (req, res) {
    var deviceLocation = DeviceLocations({
        markerId: '3',
        name: 'Địa điểm 3',
        address: 'Số abc đường xxx33333',
        phone: '0433333',
        lat: 21.024551,
        long: 105.854970
    });
    deviceLocation.save({}, function (err) {
        if (err) {

        } else {

        }
    });
});

app.listen(config.servicePort);