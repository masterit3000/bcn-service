var express = require('express');
var app = express();
var io = require('socket.io')(8899);


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    console.log('client connected: ' + socket.id);

    socket.on('AndroidConnected', function (data) {
        io.emit('DeviceConnected', { isFire: data.isFire, Lat: data.Lat, Long: data.Long });
    });

    socket.on('AndroidDisconnected', function (data) {
        io.emit('DeviceDisconnected', true);
    });

    socket.on('ClientDeviceState', function (data) {
        console.log(data.FireState);
        io.emit('BackendFireState', { FireState: data.FireState });
    });

    socket.on('disconnect', function () {
        console.log('Client has disconnected to the server!');
    });
});

app.listen(8898);