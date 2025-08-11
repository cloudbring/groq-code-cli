import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'happy-dom',
		globals: true,
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
			all: true,
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
				lines: 90,
				functions: 90,
				branches: 90,
				statements: 90,
			},
		},
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'dist'],
	},
	resolve: {
		alias: {
			'@': '/src',
		},
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		extensionAlias: {
			'.js': ['.ts', '.js'],
			'.jsx': ['.tsx', '.jsx']
		}
	},
});