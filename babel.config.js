module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      // Add any additional Babel plugins here if needed
      'react-native-reanimated/plugin', // Required for react-native-reanimated
    ],
  };
}; 