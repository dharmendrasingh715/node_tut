/*
 * Worker related files
 *
 */

var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');


// Initiate the worker object
var workers = {};

// Lookup all the checks, get their data, send to a validator
workers.gatherAllChecks = function () {
    // Get all the checks
    _data.list('checks', function (err, checks) {        
        if (!err && checks.length > 0) {
            checks.forEach(function (check) {
                // Read the check data
                _data.read('checks', check, function (err, originalCheckData) {
                    if (!err && originalCheckData) {
                        // Pass it to validator, and let that function continue or log the errors
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading one of check\'s data');

                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process');
        }
    });
};

// Sanity-check the check data
workers.validateCheckData = function (checkData) {
    checkData = typeof (checkData) == 'object' && checkData !== null ? checkData : {};
    checkData.id = typeof (checkData.id) == 'string' && checkData.id.trim().length == 20 ? checkData.id.trim() : false;
    checkData.userPhone = typeof (checkData.userPhone) == 'string' && checkData.userPhone.trim().length == 10 ? checkData.userPhone.trim() : false;
    checkData.protocol = typeof (checkData.protocol) == 'string' && ['http', 'https'].indexOf(checkData.protocol) > -1 ? checkData.protocol : false;
    checkData.url = typeof (checkData.url) == 'string' && checkData.url.trim().length > 0 ? checkData.url.trim() : false;
    checkData.method = typeof (checkData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(checkData.method) > -1 ? checkData.method : false;
    checkData.successCodes = typeof (checkData.successCodes) == 'object' && checkData.successCodes instanceof Array && checkData.successCodes.length > 0 ? checkData.successCodes : false;
    checkData.timeoutSeconds = typeof (checkData.timeoutSeconds) == 'number' &&
        checkData.timeoutSeconds % 1 === 0 &&
        checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds : false;

    // Set the keys that may be not set(if the worker has not been seen by the worker)
    checkData.state = typeof (checkData.state) == 'string' && ['up', 'down'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
    checkData.lastChecked = typeof (checkData.lastChecked) == 'number' &&
        checkData.lastChecked > 0 ? checkData.lastChecked : false;

    // If all the checks pass, pass the data along to next step in the process
    if (checkData.id &&
        checkData.userPhone &&
        checkData.protocol &&
        checkData.url &&
        checkData.method &&
        checkData.successCodes &&
        checkData.timeoutSeconds) {
        workers.performCheck(checkData);
    } else {
        console.log("Error: One of the check is not properly formatted. Skipping it");
    }
};



// Perform the check, send the checkData and the outcome to next process
workers.performCheck = function (checkData) {
    // Prepare the initial check outcome
    var checkOutcome = {
        'error': false,
        'responseCode': false
    };

    // Mark the outcome has not been sent yet
    var outcomeSent = false;

    // Parse the hostname and the path of check data
    var parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true);
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.path; //Using path not pathname because we want querysting

    var requestDetails = {
        'protocol': checkData.protocol + ':',
        'hostname': hostname,
        'method': checkData.method.toUpperCase(),
        'path': path,
        'timeout': checkData.timeoutSeconds * 1000
    };

    // Instantiate the request Object
    var _moduleToUse = checkData.protocol == 'http' ? http : https;
    var req = _moduleToUse.request(requestDetails, function (res) {
        var status = res.statusCode;

        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function (error) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': error
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the timeout event so it doesn't get thrown
    req.on('timeout', function (error) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    // End the request
    req.end();
};

// Process the checkOutcome, update the check data, trigger the user if needed
// Logic for accomodating the check that has never been tested before
workers.processCheckOutcome = function (checkData, checkOutcome) {
    // Check if check is up or down
    var state = !checkOutcome.error &&
        checkOutcome.responseCode &&
        checkData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // Decide if an alert is needed
    var alertWanted = checkData.lastChecked && checkData.state !== state ? true : false;

    // Update the checkData
    var newCheckData = checkData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update('checks', checkData.id, newCheckData, function (error) {
        if (!error) {
            // Send the checkData to next step in the process
            if (alertWanted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not been changed, no alert needed');
            }
        } else {
            console.log('Error updating one of the check');
        }
    });
};

// Alert user about change check status
workers.alertUserToStatusChange = function (checkData) {
    var message = 'Alert: Your check for ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' is currently ' + checkData.state;

    // Use helpers to send twilio sms
    helpers.sendTwilioSms(checkData.userPhone, message, function (error) {
        if (!error) {
            console.log('Success: User was alerted to a status change in a check via sms: ',message);
        } else {
            console.log('Error: Could not send sms alert to user who had change in status in one of there checks');
        }
    });
};

// Timer to execute the worker-process once per minute 
workers.loop = function () {
    setInterval(function () {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.init = function () {
    console.log('Worker Started');
    // Executes all the checks immediately
    workers.gatherAllChecks();

    // Call the loop so the checks execute later
    workers.loop();
};

module.exports = workers;