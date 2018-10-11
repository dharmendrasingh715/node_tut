// Dependencies
var config = require("./config");
var http = require("http");
var https = require("https");
var fs = require("fs");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var handlers = require('./handlers');
var helpers = require("./helpers");
var path = require("path");

// Instantiate the server module
var server = {};

// The http server init
server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req,res);
});

// The https server init
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.httpsServer = https.createServer
(server.httpsServerOptions,function(req, res){
    server.unifiedServer(req,res);
});

// All the logic for both http and https server
server.unifiedServer = function(req, res) {
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath  = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query; 

    // Get the method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    }).on('end', function(){
        buffer += decoder.end();

        //Chose the handler for this request, if not found then use not found handler
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath]: handlers.notFound;

        //Construct the data object to send to handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to handler specified in router
        chosenHandler(data, function(statusCode, payload){
            // Use the status code called back from handler or default to 200
            statusCode = typeof(statusCode) == 'number'? statusCode: 200;

            //same with payload
            payload = typeof(payload) == 'object'? payload:{};

            //convert payload to string
            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log('Returning this response: ', statusCode, payloadString);
        });
    });
};

// Init server
server.init = function () {
    // Start the server, and have it listen on port set in env
server.httpServer.listen(config.httpPort, function(){
    console.log("Server is listening on port "+ config.httpPort);
});

// Start the server, and have it listen on port set in env
server.httpsServer.listen(config.httpsPort, function(){
    console.log("Server is listening on port "+ config.httpsPort);
});

};

// Define a request router
server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

module.exports = server;