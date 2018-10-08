/*
* Sub handler for tokens
*
*/

var _data = require("./../data");
var helpers = require("./../helpers");
var _tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none 
_tokens.post = function (data, callback) {
    var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim(): false; 
    var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false;

    if(phone && password) {
        // Lookup for user who matches that phone number
        _data.read('users', phone, function (err, userData) {
            if(!err && userData) {
                // Hash the password
                var hashedPassword = helpers.hash(password);
                // Check if password matches 
                if(hashedPassword == userData.hashedPassword) {
                    // If valid, create an new token with a random name. set expiration date for 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000*60*60;
                    var tokenObject  = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens',tokenId, tokenObject, function (err) {
                        if(!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create new tokens'});
                        }     
                    });

                } else {
                    callback(400, {'Error': 'Password did not match with specified user\'s password'});
                }
            } else {
                callback(400, {'Error': 'Specified user does not exist'});
            }     
        });
    }
}

// Tokens - get
// Required data: id
// Optional data: none
_tokens.get = function (data,  callback) {
    // Check the id is provided
    var tokenId = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.length ==20 ? data.queryStringObject.id.trim(): false;
    if(tokenId) {
        _data.read('tokens', tokenId, function(err, tokenData){
            if(!err) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
}

// Tokens - Put
// Required data: id, extend
// Optional data: none
_tokens.put = function (data, callback) {
    //Check for required field
    var id = typeof(data.payload.id) == 'string'  && data.payload.id.trim().length ==20 ? data.payload.id.trim(): false;
    var extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend == true ? data.payload.extend: false; 

    if(id && extend) {
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData) {
                // Update the fields necessary
                if(tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 *60;
                    // Store the new update
                    _data.update('tokens', id, tokenData, function(err){
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not update token\'s expiery time'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Specified token has been expired'});        
                }
            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'});
    }
}

// Tokens - Delete
// Required data: id
// Optional data: none
_tokens.delete = function (data, callback) {
    // Check the id is provided
    var id = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.trim().length ==20 ? data.queryStringObject.id.trim(): false;

    if(id) {
        // Lookup for specified token
        _data.read('tokens', id, function (err, tokenData) {
            if(!err && tokenData) {
                // Delete the files for specified token
                _data.delete('tokens', id, function(err){
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete specified token'});
                    }
                });
            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            }       
        })
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
}

// Verify if a given token id is still valid for an user
_tokens.verify = function (id, phone, callback) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData){
        if(!err && tokenData) {
            if(tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false)
        }
    });
}

module.exports = _tokens;