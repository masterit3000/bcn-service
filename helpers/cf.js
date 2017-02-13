function buildResponse(responseCode, responseText){
    var response = new Object();
    response.ResponseCode = responseCode;
    response.ResponseText = responseText;
    return response;
}

exports.buildResponse = buildResponse;