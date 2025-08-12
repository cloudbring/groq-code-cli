import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { setReadFilesTracker, validateReadBeforeEdit, getReadBeforeEditError } from '@src/tools/validators';

describe('validators', () => {
	describe('validateReadBeforeEdit', () => {
		beforeEach(() => {
			// Reset tracker before each test
			setReadFilesTracker(null as any);
		});

		it('should return true when no tracker is set', () => {
			const result = validateReadBeforeEdit('/test/file.txt');
			expect(result).toBe(true);
		});

		it('should return true when file has been read', () => {
			const tracker = new Set<string>();
			const filePath = '/test/file.txt';
			const resolvedPath = path.resolve(filePath);
			
			tracker.add(resolvedPath);
			setReadFilesTracker(tracker);
			
			const result = validateReadBeforeEdit(filePath);
			expect(result).toBe(true);
		});

		it('should return false when file has not been read', () => {
			const tracker = new Set<string>();
			setReadFilesTracker(tracker);
			
			const result = validateReadBeforeEdit('/test/unread.txt');
			expect(result).toBe(false);
		});

		it('should handle relative paths correctly', () => {
			const tracker = new Set<string>();
			const relativePath = './test/file.txt';
			const absolutePath = path.resolve(relativePath);
			
			tracker.add(absolutePath);
			setReadFilesTracker(tracker);
			
			const result = validateReadBeforeEdit(relativePath);
			expect(result).toBe(true);
		});

		it('should handle different path formats for same file', () => {
			const tracker = new Set<string>();
			const filePath1 = '/test/../test/file.txt';
			const filePath2 = '/test/file.txt';
			const resolvedPath = path.resolve(filePath2);
			
			tracker.add(resolvedPath);
			setReadFilesTracker(tracker);
			
			const result = validateReadBeforeEdit(filePath1);
			expect(result).toBe(true);
		});
	});

	describe('getReadBeforeEditError', () => {
		it('should return error message with file path', () => {
			const filePath = '/test/file.txt';
			const error = getReadBeforeEditError(filePath);
			
			expect(error).toBe(`File must be read before editing. Use read_file tool first: ${filePath}`);
		});

		it('should handle relative paths in error message', () => {
			const filePath = './relative/path.js';
			const error = getReadBeforeEditError(filePath);
			
			expect(error).toBe(`File must be read before editing. Use read_file tool first: ${filePath}`);
		});
	});

	describe('setReadFilesTracker', () => {
		it('should set tracker correctly', () => {
			const tracker1 = new Set<string>(['file1.txt']);
			const tracker2 = new Set<string>(['file2.txt']);
			
			setReadFilesTracker(tracker1);
			expect(validateReadBeforeEdit('file1.txt')).toBe(false); // Not resolved path
			
			setReadFilesTracker(tracker2);
			expect(validateReadBeforeEdit('file2.txt')).toBe(false); // Not resolved path
		});

		it('should allow resetting tracker to null', () => {
			const tracker = new Set<string>();
			setReadFilesTracker(tracker);
			expect(validateReadBeforeEdit('/test/file.txt')).toBe(false);
			
			setReadFilesTracker(null as any);
			expect(validateReadBeforeEdit('/test/file.txt')).toBe(true);
		});
	});
});