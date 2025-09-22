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
    extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
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
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("@tailwindcss/postcss"),
                  require("autoprefixer"),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, "../../packages/builder-plugins/dist"),
        use: [
          "style-loader",
          "css-loader",
        ],
      },
    ],
  },
  devServer: {
    port: 1269,
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
