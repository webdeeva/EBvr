const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallback for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    util: require.resolve('util/'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
    assert: require.resolve('assert/'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url/')
  };
  
  // Handle node: protocol imports
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false
    }
  });

  // Add alias for node: imports
  config.resolve.alias = {
    ...config.resolve.alias,
    'node:crypto': require.resolve('crypto-browserify'),
    'node:stream': require.resolve('stream-browserify'),
    'node:buffer': require.resolve('buffer/'),
    'node:util': require.resolve('util/'),
    'node:assert': require.resolve('assert/'),
    'node:http': require.resolve('stream-http'),
    'node:https': require.resolve('https-browserify'),
    'node:os': require.resolve('os-browserify/browser'),
    'node:url': require.resolve('url/'),
    'node:process': require.resolve('process/browser')
  };
  
  // Add plugins for Buffer and process
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ];
  
  // Ignore certain warnings
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Critical dependency/
  ];
  
  return config;
};