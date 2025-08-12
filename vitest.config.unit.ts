import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		name: 'unit',
		environment: 'node',
		globals: true,
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'node_modules/',
				'dist/',
				'*.config.ts',
				'src/**/*.d.ts',
				'src/core/cli.ts',
				'**/*.test.{ts,tsx}',
				'**/*.spec.{ts,tsx}',
				'coverage/**',
				'test/**',
			],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
		},
		include: ['test/unit/**/*.{test,spec}.{ts,tsx}', 'src/**/*.unit.{test,spec}.{ts,tsx}'],
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