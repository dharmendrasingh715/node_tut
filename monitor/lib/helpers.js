/*
*   Utility file 
*
*/

// Dependencies
var crypto = require("crypto");
var config = require("./config");
var https = require("https");
var querystring = require("querystring");

// Container for all helpers
var helpers = {};

// Hash function (SHA256)
helpers.hash = function (string) {
    if(typeof(string) === 'string' && string.length> 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
        return hash;
    } else {
        return false;
    }
}

// Create json object from json
helpers.parseJsonToObject = function (string) {
    try {
        var obj = JSON.parse(string);
        return obj;
    } catch (error) {
        return {};
    }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function (len) {
    len = typeof(len) == 'number' && len > 0 ? len : false;
    if(len) {
        // All possible characters that could go into the string 
        var possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';

        //Loop over the possible character and pick a character at random till desired length.
        var str = '';
        
        for(var i = 0; i < len; i++) {
            var randomCharacter = possibleChars.charAt(Math.floor(Math.random()*possibleChars.length));
            str += randomCharacter;
        }

        return str;

    }  else {
        return false;
    }
}

// Sends an SMS message via Twilio
helpers.sendTwilioSms = function (phone, msg, callback) {
    var phone = typeof(phone) == "string" && phone.trim().length == 10 ? phone.trim() : false;
    var msg = typeof(msg) == "string" && msg.trim().length <= 1600 ?  msg.trim() : false;

    if(phone && msg) {
        // Configure the request payload
        var payload = {
            'From' : config.twilio.fromPhone,
            'To': '+91'+phone,
            'Body': msg
        };

        // Stringify the payload
        var stringPayload = querystring.stringify(payload);

        // configure the request details
        var requestDetails = {
            'protocol': 'https',
            'host': 'api.twilio.com',
            'method': 'POST',
            'path': ''
        }
    } else {
        callback('Given parameters are missing or invalid');
    }
}

// Export the helper
module.exports = helpers;