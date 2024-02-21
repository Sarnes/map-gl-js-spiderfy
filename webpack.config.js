const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/index.js',
  experiments: {
    outputModule: true,
  },
  externalsPresets: {
    node: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    module: true,
    library: { type: 'module' },
    environment: { module: true },
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: [
          'source-map-loader',
          {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        }],
      },
    ],
  },
};
