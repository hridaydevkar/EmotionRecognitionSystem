module.exports = {
  style: {
    postcssOptions: {
      plugins: [
        require('@tailwindcss/postcss')(),
        require('autoprefixer'),
      ],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings from face-api.js
      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsLoaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource &&
            warning.module.resource.includes('node_modules') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ];
      return webpackConfig;
    },
  },
};
