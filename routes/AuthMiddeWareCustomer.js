var jwt = require('jsonwebtoken');
var config = require('../config');
var responseCode = require('../ResponseCode');

function AuthMiddewareCustomer(req, res, next) {
    var token = req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.jwtKeyCustomer, function (err, decoded) {
            if (err) {
                var errorText = "";
                if (err.name === 'TokenExpiredError') {
                    errorText = 'Token session time out ';
                }
                else {
                    errorText = 'Token verify failed';
                }

                return res.status(403).send({
                    ResponseCode: responseCode.ERROR,
                    ResponseText: errorText
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error

        return res.status(403).send({
            ResponseCode: responseCode.ERROR,
            ResponseText: 'No token provided'
        });
    }
}

module.exports.AuthMiddewareCustomer = AuthMiddewareCustomer;