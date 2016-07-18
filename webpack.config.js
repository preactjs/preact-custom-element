module.exports = {
	entry: "./src/index.js",
	output: {
		path: "dist",
		filename: "bundle.js",
		libraryTarget: "umd"
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /(node_modules|bower_components)/,
			loader: "babel",
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
	}
};
