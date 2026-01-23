// contents of webpack.config.js
const path = require("path");
const pkg = require("./package.json");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: `./src/${pkg.entry}.tsx`,
  externals: {
    "@builder.io/react": "@builder.io/react",
    "@builder.io/app-context": "@builder.io/app-context",
    "@emotion/core": "@emotion/core",
    react: "react",
    "react-dom": "react-dom",
  },
  output: {
    filename: pkg.output,
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "system",
  },
  resolve: {
    extensions: [".js", ".jsx", ".tsx", ".ts", ".css"],
    alias: {
      "@builder-plugins": path.resolve(__dirname, "../../packages/builder-plugins/src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts|jsx|js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, "src"),
        use: [
          "style-loader",
          "css-loader",
          "postcss-loader",
        ],
      },
      {
        test: /\.css$/,
        include: [
          /builder-plugins/,
          /packages\/builder-plugins/,
        ],
        use: [
          {
            loader: path.resolve(__dirname, "empty-loader.js"),
          },
        ],
      },
    ],
  },
  devServer: {
    port: 1268,
    static: {
      directory: path.join(__dirname, "./dist"),
    },
    headers: {
      "Access-Control-Allow-Private-Network": "true",
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [new Dotenv()],
};
