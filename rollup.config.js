import terser from '@rollup/plugin-terser';
import {defineConfig} from 'rollup';

const TERSER = terser({
	compress: {
		toplevel: true,
		passes: 2, 
		dead_code: true
	}
});

export default defineConfig([
	{
		input: './src/index.js',
		output: [
			{
				file: './dist/index.mjs',
				format: 'es',
			},
			{
				file: './dist/index.min.js',
				format: 'es',
				plugins: [TERSER],
			},
			{
				file: './dist/index.cjs',
				format: 'cjs',
			},
		],
	},
]);
