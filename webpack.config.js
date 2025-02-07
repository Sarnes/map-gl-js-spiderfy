const path = require('path');

module.exports = (env, argv) => {
    return {
      mode: argv.mode,
      entry: './src/index.js',
      experiments: {
        outputModule: true,
      },
      externalsPresets: {
        node: true,
      },
      devtool: "source-map",
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
  }
};
