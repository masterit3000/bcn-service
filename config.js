module.exports = {
    'database': 'mongodb://pccc:1234567@103.48.83.139:27017/PCCC',
    'socketPort': 8899,
    'servicePort': 8898,
    'algorithm': 'aes256',
    'cryptoKey': 'pcccCryptoKey',
    'jwtSessionExpiresTime': '100 days',
    'jwtKey': 'pcccJWTKey',
    'basicAuthUsername': 'pccc',
    'basicAuthPassword': 'basicAuthPassword',
    'senderEmail': '', //VD: abc@gmail.com
    'senderEmailPassword': '', // 123456
    'smtpServer': '', // smtp server
    'senderFromName': '', //VD: Dang tuan tu <tu@gmail.com>
    'isUsingSSL': true // Su dung ssl
};