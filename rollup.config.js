import pkg from './package.json';
import babel from 'rollup-plugin-babel';
const fs = require('fs');
let linter = false;
try {
	fs.statSync('./node_modules/rollup-plugin-eslint/package.json');
  linter = require('rollup-plugin-eslint');
  console.log('Building with linting');
}
catch(err) {
  console.log('Building without linting');
}

const rollupPlugins = []

if (linter) {
	rollupPlugins.push(
		linter.eslint({
			throwOnError: true,
			throwOnWarning: true,
			include: ['src/**'],
		  exclude: ['node_modules/**', 'dist/**']
		})
	);
}
rollupPlugins.push(
  babel({
	  exclude: ['node_modules/**']
	})
);

export default [
	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify
	// `file` and `format` for each target)
	{
		input: 'src/main.js',
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		],
		plugins: rollupPlugins,
  	external: [ 'oidc-client-ts' ]
	}
];
