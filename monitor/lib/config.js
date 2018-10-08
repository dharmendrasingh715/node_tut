/*
 * Create and export configuration variables
 *
 */

// Container for all environments

var environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsaSecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'AC5d72bd9f77357e96df8ee0da074dafb8',
        'authToken': 'd3881313b86c10987b3a0561f0951633  ',
        'fromPhone': '+15005550006'
    }
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoaSecret',
    'maxChecks': 5,
    'twilio': {
        'fromPhone': '',
        'accountSid': '',
        'config.twilio.authToken': ''
    }
};

// Determine which environment was passed as cli argument
var currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if current environment available or default to staging
var environmenttoExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmenttoExport;