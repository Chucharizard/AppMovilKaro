/**
 * Enable autolinking for react-native-maps with proper configuration
 */
module.exports = {
  dependencies: {
    'react-native-maps': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-maps/android',
        },
      },
    },
  },
};
