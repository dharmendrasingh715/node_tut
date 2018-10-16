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
                _data.read('checks',check, function (err, originalCheckData) {
                    if(!err && originalCheckData) {
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
    checkData = typeof(checkData) == 'object' && checkData !== null? checkData: {};
    checkData.id = typeof(checkData.id) == 'string' && checkData.id.trim().length == 20? checkData.id.trim(): false;
    checkData.userPhone = typeof(checkData.userPhone) == 'string' && checkData.userPhone.trim().length == 10? checkData.userPhone.trim(): false;
    checkData.protocol = typeof(checkData.protocol) == 'string' && ['http','https'].indexOf(checkData.protocol)> -1 ? checkData.protocol: false;
    checkData.url = typeof(checkData.url) == 'string' && checkData.url.trim().length > 0 ? checkData.url.trim(): false;
    checkData.method = typeof(checkData.method) == 'string' && ['post','get','put','delete'].indexOf(checkData.method)> -1 ? checkData.method: false;
    checkData.successCodes = typeof(checkData.method) == 'object' && checkData.successCodes instanceof Array && checkData.successCodes.length > 0 ? checkData.successCodes: false;
    checkData.timeoutSeconds = typeof(checkData.timeoutSeconds) == 'number' && 
    checkData.timeoutSeconds % 1 === 0 &&
    checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds: false;

    // Set the keys that may be not set(if the worker has not been seen by the worker)
    checkData.state = typeof(checkData.state) == 'string' && ['up','down'].indexOf(checkData.state)> -1 ? checkData.state: 'down';
    checkData.lastChecked = typeof(checkData.lastChecked) == 'number' && 
    checkData.lastChecked > 0 ? checkData.lastChecked: false;

    // If all the checks pass, pass the data along to next step in the process
    if(checkData.id &&
    checkData.userPhone &&
    checkData.protocol &&
    checkData.url &&
    checkData.method &&
    checkData.successCodes &&
    checkData.timeoutSeconds) {
        workers.performCheck(checkData);
    } else {
        console.log("Error: One of thecheck is not properly formatted. Skipping it");        
    }   
};



// Perform the check, send the checkData and the outcome to next process
workers.performCheck = function (checkData) {
          
};

// Timer to execute the worker-process once per minute 
workers.loop = function () {
    setInterval(function () {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

workers.init = function () {
    // Executes all the checks immediately
    workers.gatherAllChecks();

    // Call the loop so the checks execute later
    workers.loop();
};

module.exports = workers;