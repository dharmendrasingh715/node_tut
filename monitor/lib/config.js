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
    'maxChecks': 5
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoaSecret',
    'maxChecks': 5
};

// Determine which environment was passed as cli argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLowerCase():'';

// Check if current environment available or default to staging
var environmenttoExport = typeof(environments[currentEnvironment]) == 'object'? environments[currentEnvironment]: environments.staging;

// Export the module
module.exports = environmenttoExport;