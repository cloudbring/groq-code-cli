export default {
	typescript: {
		rewritePaths: {
			'@src/': 'src/'
		},
		compile: 'tsc'
	},
	files: [
		'test/**/*.test.ts',
		'test/**/*.test.tsx'
	],
	nodeArguments: [
		'--import=tsx'
	]
};