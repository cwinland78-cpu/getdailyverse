const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Explicitly set the asset plugins to avoid resolve-from issues on EAS
config.transformer.assetPlugins = [
  path.resolve(__dirname, 'node_modules/expo-asset/tools/hashAssetFiles'),
];

module.exports = config;
