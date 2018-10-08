/*
* Sub handler for users
*
*/

var _data = require("./../data");
var helpers = require("./../helpers");
var _tokens = require("./_tokens");
var _users = {};

// Users - Post
_users.post = function (data, callback) {
    // Check that all required field are filled out
    var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim(): false; 
    var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim(): false; 
    var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim(): false; 
    var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false; 

    if(firstName && lastName && phone && password) {
        // Check if user exists
        _data.read('users', phone, function (err, data) {
            if(err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                if(hashedPassword) {
                    // Create the user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword
                    };

                    // Store the user
                    _data.create('users',phone,userObject, function (err) {
                        console.log(err);
                        
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create the new user'});
                        }
                    })
                } else {
                    callback(500, {'Error': 'Could not hash the user\'s password'});
                }
            } else {
                console.log(err);
                
                callback(400, {'Error': 'A user with that phone number already exists'});
            }     
        });

    } else {
        callback(400,{'Error': 'Missing required field'});
    }
}

// Users - Get
// Required data: phone
// Optional data: none
_users.get = function (data, callback) {
    // Check the phone number is provided
    var phone = typeof(data.queryStringObject.phone) == 'string'  && data.queryStringObject.phone.trim().length ==10 ? data.queryStringObject.phone.trim(): false;

    // Get token from headers
    var token  = typeof(data.headers.token) == 'string' ? data.headers.token: false;
    _tokens.verify(token, phone, function (valid) {
        if(valid) {
            if(phone) {
                _data.read('users', phone, function(err, data){
                    if(!err) {
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                })
            } else {
                callback(400, {'Error': 'Missing required field'});
            }
        } else {
            callback(403, {'Error': 'Token is missing or invalid'});
        }
    })
}

// Users - Put
// Required data: phone
// Optional data: firstname, lastname (atleast 1 field is required)
_users.put = function (data, callback) {
    //Check for required field
    var phone = typeof(data.payload.phone) == 'string'  && data.payload.phone.trim().length ==10 ? data.payload.phone.trim(): false;
    var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim(): false; 
    var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim(): false; 

    // Get token from headers
    var token  = typeof(data.headers.token) == 'string' ? data.headers.token: false;
    _tokens.verify(token, phone, function (valid) {
        if(valid) {
            if(phone) {
                if(firstName || lastName) {
                    // Lookup the user
                    _data.read('users', phone, function(err, userData){
                        if(!err && userData) {
                            // Update the fields necessary
                            if(firstName) {
                                userData.firstName = firstName;
                            } 

                            if(lastName) {
                                userData.lastName = lastName;
                            }

                            // Store the new update
                            _data.update('users', phone, userData, function(err){
                                if(!err) {
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update user data'});
                                }
                            });
                        } else {
                            callback(400, {'Error': 'Specified user does not exist'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Either first name or last name should be provided to update'});
                }
            } else {
                callback(400, {'Error': 'Missing required field'});
            }
        } else {
            callback(403, {'Error': 'Token is missing or invalid'});
        }
    });    
}


// Users - Delete
// Required data: phone
_users.delete = function (data, callback) {
    // Check the phone number is provided
    var phone = typeof(data.queryStringObject.phone) == 'string'  && data.queryStringObject.phone.trim().length ==10 ? data.queryStringObject.phone.trim(): false;
     // Get token from headers
     var token  = typeof(data.headers.token) == 'string' ? data.headers.token: false;
     _tokens.verify(token, phone, function (valid) {
         if(valid) {
            if(phone) {
                // Lookup for specified user
                _data.read('users', phone, function (err, userData) {
                    if(!err && userData) {
                        // Delete the files for specified user
                        _data.delete('users', phone, function(err){
                            if(!err) {
                                var userChecks  =  typeof(userData.checks) == 'object' && userData.checks instanceof Array? userData.checks : [];
                                var checksToDelete = userChecks.length;
                                if(checksToDelete > 0) {
                                    var checksDeleted = 0;
                                    var deletionError = false;
                                    // Looping through user's check to delete them individually
                                    userChecks.forEach(function (userCheck) {
                                        _data.delete('checks', userCheck, function (err) {
                                            if(err) {
                                                deletionError = true;
                                            } 
                                            checksDeleted++;
                                            if(checksDeleted == checksToDelete) {
                                                if(deletionError) {
                                                    callback(500,{"Error": "There was error deleting user's checks, some of the checks may still be existing"})
                                                } else {
                                                    callback(200);
                                                }
                                            }
                                        });
                                    });

                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {'Error': 'Could not delete user data'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'Specified user does not exist'});
                    }       
                })
            } else {
                callback(400, {'Error': 'Missing required field'});
            }
        } else {
            callback(403, {'Error': 'Token is missing or invalid'});
        }
    });  
}

module.exports = _users;