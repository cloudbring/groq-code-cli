import { describe, it, expect } from 'vitest';
import { IGNORE_PATTERNS } from './constants';

describe('constants', () => {
	describe('IGNORE_PATTERNS', () => {
		it('should be a Set', () => {
			expect(IGNORE_PATTERNS).toBeInstanceOf(Set);
		});

		it('should contain common directories to ignore', () => {
			expect(IGNORE_PATTERNS.has('node_modules')).toBe(true);
			expect(IGNORE_PATTERNS.has('.git')).toBe(true);
			expect(IGNORE_PATTERNS.has('dist')).toBe(true);
			expect(IGNORE_PATTERNS.has('build')).toBe(true);
		});

		it('should contain Python-specific patterns', () => {
			expect(IGNORE_PATTERNS.has('__pycache__')).toBe(true);
			expect(IGNORE_PATTERNS.has('venv')).toBe(true);
			expect(IGNORE_PATTERNS.has('.venv')).toBe(true);
			expect(IGNORE_PATTERNS.has('*.pyc')).toBe(true);
		});

		it('should contain IDE-specific patterns', () => {
			expect(IGNORE_PATTERNS.has('.idea')).toBe(true);
			expect(IGNORE_PATTERNS.has('.vscode')).toBe(true);
		});

		it('should contain OS and temporary file patterns', () => {
			expect(IGNORE_PATTERNS.has('.DS_Store')).toBe(true);
			expect(IGNORE_PATTERNS.has('*.log')).toBe(true);
			expect(IGNORE_PATTERNS.has('*.tmp')).toBe(true);
		});

		it('should have the expected number of patterns', () => {
			expect(IGNORE_PATTERNS.size).toBe(13);
		});
	});
});