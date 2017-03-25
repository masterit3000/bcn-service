var crypto = require('crypto');
var config = require('../config');

function encypt(text) {
    var algorithm = config.algorithm;
    var cryptoKey = config.cryptoKey;
    var cipher = crypto.createCipher(algorithm, cryptoKey);
    var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    return encrypted;
}

function decrypt(text){
    var algorithm = config.algorithm;
    var cryptoKey = config.cryptoKey;
    var encrypted = text;
    var decipher = crypto.createDecipher(algorithm, cryptoKey);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
}

exports.encypt = encypt;
exports.decypt = decrypt;