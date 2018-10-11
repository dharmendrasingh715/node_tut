/*
* Sub handler for checks
*
*/

var _data = require("./../data");
var helpers = require("./../helpers");
var _tokens = require("./_tokens");
var config = require("./../config");

var _checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
_checks.post = function(data, callback) {
    // Check that all required field are filled out
    var protocol = typeof(data.payload.protocol) === 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol: false;
    var url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim(): false;
    var method = typeof(data.payload.method) === 'string' && ['get','post','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method: false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 1 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

    if(protocol && url && method && successCodes && timeoutSeconds) {
        // Get token from headers
        var token  = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        
        // Lookup the token 
        _data.read('tokens',token, function(err, tokenData) {
            if(!err && tokenData && tokenData.expires > Date.now()) {
                
                var userPhone = tokenData.phone;
                // Lookup the user
                _data.read('users', userPhone, function (err, userData) {
                    if(!err && userData) {
                        var userChecks  =  typeof(userData.checks) == 'object' && userData.checks instanceof Array? userData.checks : []; 
                        // verify if checks does not pass max number of checks
                        if(userChecks.length < config.maxChecks) {
                            // Create random id for check
                            var checkId = helpers.createRandomString(20);

                            // Create the check object, and include the user's phone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            _data.create('checks', checkId, checkObject, function (err) {
                                if(!err) {

                                    // Add the check id to user checks
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users',userPhone, userData, function (err) {
                                        if(!err) {
                                            // Return the data about the new check
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'Error': 'Could not update user data with new check'});
                                        }
                                    });

                                } else {
                                    callback(500, {'Error': 'Could not create the new check'});
                                }
                            });
                        } else {
                            callback(400, {'Error': 'The user already has the maximum number of checks('+config.maxChecks+')'});
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required input(s), or input(s) are invalid'});
    }
};

// Checks - get
// Required data: id
// Optional data: none
_checks.get = function(data, callback) {
    // Check the check id is provided
    var id = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.trim().length ==20 ? data.queryStringObject.id.trim(): false;

    if(id) {
        // Lookup the check
        _data.read('checks', id, function (err, checkData) {
            if(!err && checkData) {
                // Get token from headers
                var token  = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                // Verify token is valid and belong to user who created check
                _tokens.verify(token, checkData.userPhone, function (valid) {
                    if(valid) {
                        // Return the data
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400);
    }
};

// Checks - put
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds (atleast 1 must be sent)
_checks.put = function(data, callback) {
     // Check that all required field are filled out
     var id = typeof(data.payload.id) == 'string'  && data.payload.id.trim().length ==20 ? data.payload.id.trim(): false;
     
     // Check for optional fields
     var protocol = typeof(data.payload.protocol) === 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol: false;
     var url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim(): false;
     var method = typeof(data.payload.method) === 'string' && ['get','post','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method: false;
     var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 1 ? data.payload.successCodes : false;
     var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

    if(id) {
        // Check for atleast 1 field is provided for updation
        if(protocol || url || method || successCodes || timeoutSeconds) {
            // Lookup the check
            _data.read('checks', id, function (err, checkData) {
                if(!err && checkData) {
                    // Get token from headers
                    var token  = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                    // Verify token is valid and belong to user who created check
                    _tokens.verify(token, checkData.userPhone, function (valid) {
                        if(valid) {
                            // Update the check fields where necessary
                            if(protocol) {
                                checkData.protocol  = protocol;
                            }
                            if(url) {
                                checkData.url  = url;
                            }
                            if(method) {
                                checkData.method  = method;
                            }
                            if(successCodes) {
                                checkData.successCodes  = successCodes;
                            }
                            if(timeoutSeconds) {
                                checkData.timeoutSeconds  = timeoutSeconds;
                            }

                            // Persist the new changes
                            _data.update('checks', id, checkData, function (err) {
                                if(!err) {
                                    callback(200);
                                } else {
                                    callback(500, {"Error": "Could not update the specified check"});
                                }
                            });
                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(404, {"Error": "Check id does not exist"});
                }
            });
        } else {
            callback(400, {"Error": "Missing fields to update"});
        }
    } else {
        callback(400, {"Error": "Missing required fields"});
    }
};

// Checks - delete
_checks.delete = function(data, callback) {
    // Check the check id is provided
    var id = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.trim().length ==20 ? data.queryStringObject.id.trim(): false;

    if(id) {
        // Lookup the check
        _data.read('checks', id, function (err, checkData) {
            if(!err && checkData) {
                // Get token from headers
                var token  = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                // Verify token is valid and belong to user who created check
                _tokens.verify(token, checkData.userPhone, function (valid) {
                    if(valid) {
                       _data.delete('checks', id, function (err) {
                            if(!err) {
                                _data.read('users', checkData.userPhone, function (err, userData) {
                                    if(!err && userData) {
                                        var userChecks  =  typeof(userData.checks) == 'object' && userData.checks instanceof Array? userData.checks : []; 
                                        var checkPosition = userChecks.indexOf(id);
                                        if(checkPosition> -1) {
                                            userChecks.splice(checkPosition,1);

                                            // Update the user object
                                            _data.update('users', checkData.userPhone, userData, function (err) {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {"Error": "Could not update user after deleting check"});
                                                }
                                            });
                                        } else {
                                            callback(500, {"Error": "Could not find check information on the user\'s object"});
                                        }
                                    } else {
                                        callback(500, {"Error":"Could not find the user who created this check"});
                                    }
                                });
                            } else {
                                callback(500, {"Error": "Could not delete check data"});
                            }
                       });
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400);
    }
};

module.exports = _checks;