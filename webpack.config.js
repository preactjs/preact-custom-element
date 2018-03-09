module.exports = {
	entry: "./src/index.js",
	output: {
		path: __dirname+"/dist",
		filename: "bundle.js",
		libraryTarget: "umd"
	},
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /(node_modules|bower_components)/,
			loader: "babel-loader",
			query: {
				presets: ["es2015", "react"],
				plugins: [
					["transform-react-jsx", { "pragma":"h" }]
				]
			},
		}]
	},
	externals: {
		preact: "preact"
	},
	mode: "production"
};
