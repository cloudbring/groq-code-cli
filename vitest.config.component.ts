import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		name: 'component',
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./test/component/setup.ts'],
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
			include: ['src/ui/**/*.{ts,tsx}'],
			exclude: [
				'node_modules/',
				'dist/',
				'*.config.ts',
				'src/**/*.d.ts',
				'**/*.test.{ts,tsx}',
				'**/*.spec.{ts,tsx}',
				'coverage/**',
				'test/**',
			],
			thresholds: {
				lines: 75,
				functions: 75,
				branches: 75,
				statements: 75,
			},
		},
		include: ['test/component/**/*.{test,spec}.{ts,tsx}', 'src/**/*.component.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'dist'],
	},
	resolve: {
		alias: {
			'@src': path.resolve(__dirname, './src')
		},
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		extensionAlias: {
			'.js': ['.ts', '.js'],
			'.jsx': ['.tsx', '.jsx']
		}
	},
});