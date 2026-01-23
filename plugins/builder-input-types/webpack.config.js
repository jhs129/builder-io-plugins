// webpack.config.js
const path = require("path");
const pkg = require("./package.json");
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
    alias: {
      "@builder-plugins": path.resolve(
        __dirname,
        "../../packages/builder-plugins/src"
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },

      // --- Tailwind entry as STRING (inject manually) ---
      {
        test: /tw\.css$/i,                  // <— name your entry file src/tw.css
        use: [
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              exportType: "string",        // <— gives you the CSS as text
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("@tailwindcss/postcss"), // Tailwind v4
                ],
              },
            },
          },
        ],
      },

      // --- Generic CSS (NOT the Tailwind entry) ---
      {
        test: /\.css$/i,
        exclude: /tw\.css$/i,              // <— avoid double-processing tw.css
        use: [
          "style-loader",
          { loader: "css-loader", options: { importLoaders: 1 } },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [require("@tailwindcss/postcss")],
              },
            },
          },
        ],
      },
    ],
  },
  devServer: {
    port: 1269,
    static: { directory: path.join(__dirname, "./dist") },
    headers: {
      "Access-Control-Allow-Private-Network": "true",
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [new Dotenv()],
};
