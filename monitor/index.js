/*
* Primary file for API
*
*/

// Dependencies

var server = require('./lib/server');
var workers = require('./lib/workers');


// Declare the app
var app = {};

// Init function
app.init  = function (params) {
    // Start the server
    server.init();

    // Start the workor
    workers.init();
};

// Execute
app.init();

// Export
module.exports = app;

