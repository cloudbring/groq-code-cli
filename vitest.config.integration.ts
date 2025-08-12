import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		name: 'integration',
		environment: 'node',
		globals: true,
		testTimeout: 20000,
		hookTimeout: 20000,
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
				lines: 70,
				functions: 70,
				branches: 70,
				statements: 70,
			},
		},
		include: ['test/integration/**/*.{test,spec}.{ts,tsx}', 'src/**/*.integration.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'dist'],
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},
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