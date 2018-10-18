/*
 * Libraray for storing and and editing the data
 *
 */

// Dependencies
var fs = require("fs");
var path = require("path");
var helpers = require("./helpers");

// Container for the module
var lib = {};

// Base dir for data folder
lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to a file
lib.create = function (dir, file, data, callback) {
    // Open file to write
    fs.open(lib.baseDir + dir + "/" + file + ".json", 'wx', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data into string
            var stringData = JSON.stringify(data);

            // Write file and close it
            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            });

        } else {
            callback('Could not create new file, it may already exists');
        }
    });
};

// Reading the data from a file
lib.read = function (dir, file, callback) {
    fs.readFile(lib.baseDir + dir + "/" + file + ".json", 'utf-8', function (err, data) {
        if (!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};

// Updating the content of file
lib.update = function (dir, file, data, callback) {
    // Open the file for writing 
    fs.open(lib.baseDir + dir + "/" + file + ".json", 'r+', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert the data to string
            var stringData = JSON.stringify(data);

            //Truncate the file
            fs.truncate(fileDescriptor, function (err) {
                if (!err) {
                    // Write file and close it
                    fs.writeFile(fileDescriptor, stringData, function (err) {
                        if (!err) {
                            fs.close(fileDescriptor, function (err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file');
                                }
                            });
                        } else {
                            callback('Error writing to existing file');
                        }
                    });
                } else {
                    callback('Error truncating to existing file');
                }
            });

        } else {
            callback('Could not open the file, it may not exist');
        }
    });
};

// Delete the file 
lib.delete = function (dir, file, callback) {
    // Unlink the file
    fs.unlink(lib.baseDir + dir + "/" + file + ".json", function (err) {
        callback(err);
    });
};

// List all files in dir 
lib.list = function (dir, callback) {
    fs.readdir(lib.baseDir + dir + '/', function (err, data) {
        if(!err && data.length>0) {
            var trimmedFileName = [];
            data.forEach(function (filename) {
                trimmedFileName.push(filename.replace('.json',''));
            });
            callback(err, trimmedFileName);
        } else {
            callback(err, data);
        }
    });
};

// Export the library
module.exports = lib;