/*
* Primary file for API
*
*/

// Dependencies
var config = require("./lib/config");
var http = require("http");
var https = require("https");
var fs = require("fs");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var handlers = require('./lib/handlers');
var helpers = require("./lib/helpers");


// 

// The http server init
var httpServer = http.createServer(function(req, res){
    unifiedServer(req,res);
});

// Start the server, and have it listen on port set in env
httpServer.listen(config.httpPort, function(){
    console.log("Server is listening on port "+ config.httpPort);
});


// The https server init
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions,function(req, res){
    unifiedServer(req,res);
});

// Start the server, and have it listen on port set in env
httpsServer.listen(config.httpsPort, function(){
    console.log("Server is listening on port "+ config.httpsPort);
});

// All the logic for both http and https server
var unifiedServer = function(req, res) {
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
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath]: handlers.notFound;

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

// Define a request router
var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};