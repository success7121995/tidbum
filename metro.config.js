const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions if needed
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'gif', 'svg');

// Configure NativeWind
module.exports = withNativeWind(config, { 
  input: './global.css' 
}); 