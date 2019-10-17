const path = require('path');

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js',
		libraryTarget: 'umd'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				query: {
					presets: [
						['@babel/preset-env'],
						[
							'@babel/preset-react',
							{
								pragma: 'h',
								pragmaFrag: 'Fragment'
							}
						]
					]
				}
			}
		]
	},
	mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
	externals: {
		preact: 'preact'
	}
};
