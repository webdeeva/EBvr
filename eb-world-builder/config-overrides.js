module.exports = function override(config, env) {
  // Add fallback for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    util: require.resolve('util/')
  };
  
  return config;
};