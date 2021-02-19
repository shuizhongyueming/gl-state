const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  externals: {},
  devtool: false,
  resolve: {
    extensions: ['.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  plugins: [],
  entry: {
    main: './src/main.ts',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    library: 'GLState',
    libraryTarget: 'global',
    filename: 'gl-state.js',
  },
  // optimization: {
  //   minimize: true,
  //   minimizer: [
  //     new TerserPlugin({
  //       exclude: /main\.ts$/,
  //     }),
  //   ],
  // },
};
