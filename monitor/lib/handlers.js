/*
* Handlers for route requests
*
*/

//Dependencies
var _data = require("./data");
var helpers = require("./helpers");
var _users = require("./subhandlers/_users");
var _tokens = require("./subhandlers/_tokens");
var _checks = require("./subhandlers/_checks");

// Define the handlers
var handlers = {}; 

//Ping handler
handlers.ping = function(data, callback) {
    callback(200);
};

//Users handlers
handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method)!== -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for users submethods
handlers._users = _users;

// Token handlers
handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method)!== -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for token handles
handlers._tokens = _tokens;

// Checks handler
handlers.checks =function (data, callback) {
    var acceptableMethods = ['get','post','put','delete'];
    if(acceptableMethods.indexOf(data.method)!= -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for checks handlers
handlers._checks = _checks;

// Not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};

module.exports = handlers;