import { describe, it, expect, test } from 'vitest';
import { IGNORE_PATTERNS } from '@src/utils/constants';

describe('constants', () => {
	describe('IGNORE_PATTERNS', () => {
		test.concurrent('should be a Set', async () => {
			expect(IGNORE_PATTERNS).toBeInstanceOf(Set);
		});

		test.concurrent('should contain common directories to ignore', async () => {
			expect(IGNORE_PATTERNS.has('node_modules')).toBe(true);
			expect(IGNORE_PATTERNS.has('.git')).toBe(true);
			expect(IGNORE_PATTERNS.has('dist')).toBe(true);
			expect(IGNORE_PATTERNS.has('build')).toBe(true);
		});

		test.concurrent('should contain Python-specific patterns', async () => {
			expect(IGNORE_PATTERNS.has('__pycache__')).toBe(true);
			expect(IGNORE_PATTERNS.has('venv')).toBe(true);
			expect(IGNORE_PATTERNS.has('.venv')).toBe(true);
			expect(IGNORE_PATTERNS.has('*.pyc')).toBe(true);
		});

		test.concurrent('should contain IDE-specific patterns', async () => {
			expect(IGNORE_PATTERNS.has('.idea')).toBe(true);
			expect(IGNORE_PATTERNS.has('.vscode')).toBe(true);
		});

		test.concurrent('should contain OS and temporary file patterns', async () => {
			expect(IGNORE_PATTERNS.has('.DS_Store')).toBe(true);
			expect(IGNORE_PATTERNS.has('*.log')).toBe(true);
			expect(IGNORE_PATTERNS.has('*.tmp')).toBe(true);
		});

		test.concurrent('should have the expected number of patterns', async () => {
			expect(IGNORE_PATTERNS.size).toBe(13);
		});
	});
});