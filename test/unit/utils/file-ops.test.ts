import test from 'ava';
import sinon from 'sinon';
import mockFs from 'mock-fs';
import * as fs from 'fs';
import * as path from 'path';
import { writeFile, createDirectory, deleteFile, displayTree, shouldIgnore } from '@src/utils/file-ops';

// Setup filesystem mocks before each test
test.beforeEach(() => {
	sinon.restore();
	mockFs.restore();
	
	// Setup mock filesystem with test files and directories
	mockFs({
		'/test': {
			'file.txt': 'existing content',
			'dir': {}
		},
		'/mockdir': {
			'dir1': {},
			'file1.txt': 'content1',
			'file2.js': 'content2',
			'.hidden': 'hidden content',
			'visible.txt': 'visible content',
			'.env': 'env content'
		}
	});
});

test.afterEach.always(() => {
	sinon.restore();
	mockFs.restore();
});

test('writeFile - should write file successfully', async (t) => {
	const result = await writeFile('/test/newfile.txt', 'content');
	
	t.is(result, true);
	
	// Verify the file was actually written
	const written = await fs.promises.readFile('/test/newfile.txt', 'utf-8');
	t.is(written, 'content');
});

test('writeFile - should return false on error', async (t) => {
	// Try to write to a path that will cause an error (like writing to a directory)
	const result = await writeFile('/test/dir', 'content');
	
	t.is(result, false);
});

test('writeFile - should handle force and backup parameters', async (t) => {
	const result = await writeFile('/test/file.txt', 'new content', true, true);
	
	t.is(result, true);
	
	// Verify the file content was updated
	const written = await fs.promises.readFile('/test/file.txt', 'utf-8');
	t.is(written, 'new content');
});

test('createDirectory - should create directory successfully', async (t) => {
	const result = await createDirectory('/test/newdir');
	
	t.is(result, true);
	
	// Verify the directory was created
	const stats = await fs.promises.stat('/test/newdir');
	t.true(stats.isDirectory());
});

test('createDirectory - should return false on error', async (t) => {
	// Mock-fs doesn't easily simulate permission errors, so this test
	// would need to be adapted or the function behavior examined
	// For now, test creating over an existing file (which should fail)
	const result = await createDirectory('/test/file.txt'); // file.txt already exists as a file
	
	t.is(result, false);
});

test('deleteFile - should delete file when force is true', async (t) => {
	const result = await deleteFile('/test/file.txt', true);
	
	t.is(result, true);
	
	// Verify the file was deleted
	const exists = await fs.promises.access('/test/file.txt').then(() => true).catch(() => false);
	t.false(exists);
});

test('deleteFile - should delete directory when force is true', async (t) => {
	const result = await deleteFile('/test/dir', true);
	
	t.is(result, true);
	
	// Verify the directory was deleted
	const exists = await fs.promises.access('/test/dir').then(() => true).catch(() => false);
	t.false(exists);
});

test('deleteFile - should return false when force is false', async (t) => {
	const result = await deleteFile('/test/file.txt', false);
	
	t.is(result, false);
	
	// File should still exist
	const exists = await fs.promises.access('/test/file.txt').then(() => true).catch(() => false);
	t.true(exists);
});

test('deleteFile - should return false when file does not exist', async (t) => {
	const result = await deleteFile('/test/nonexistent.txt', true);
	
	t.is(result, false);
});

test('deleteFile - should return false on other errors', async (t) => {
	// Create a read-only directory to simulate permission errors
	mockFs.restore();
	mockFs({
		'/readonly': mockFs.directory({
			mode: parseInt('444', 8),
			items: {
				'file.txt': 'content'
			}
		})
	});
	
	const result = await deleteFile('/readonly/file.txt', true);
	
	t.is(result, false);
});

test('displayTree - should display directory tree', async (t) => {
	const result = await displayTree('/mockdir', false);
	
	t.truthy(result);
	t.true(result.includes('dir1'));
	t.true(result.includes('file1.txt'));
	t.true(result.includes('file2.js'));
	t.true(result.includes('visible.txt'));
});

test('displayTree - should handle directory not found', async (t) => {
	const result = await displayTree('/nonexistent', false);
	
	t.is(result, '');
});

test('displayTree - should filter hidden files when showHidden is false', async (t) => {
	const result = await displayTree('/mockdir', false);
	
	t.truthy(result);
	t.false(result.includes('.hidden'));
	t.true(result.includes('visible.txt'));
});

test('displayTree - should show hidden files when showHidden is true', async (t) => {
	const result = await displayTree('/mockdir', true);
	
	t.truthy(result);
	t.true(result.includes('.hidden'));
	t.true(result.includes('visible.txt'));
});

test('displayTree - should handle errors during readdir', async (t) => {
	// Create a directory with no read permissions
	mockFs.restore();
	mockFs({
		'/noaccess': mockFs.directory({
			mode: parseInt('000', 8)
		})
	});
	
	const result = await displayTree('/noaccess', false);
	
	t.is(result, '');
});

// shouldIgnore tests
test('shouldIgnore - should ignore node_modules', (t) => {
	t.true(shouldIgnore('node_modules'));
	t.true(shouldIgnore('path/node_modules'));
	t.true(shouldIgnore('node_modules/package'));
});

test('shouldIgnore - should ignore .git directory', (t) => {
	t.true(shouldIgnore('.git'));
	t.true(shouldIgnore('path/.git'));
	t.true(shouldIgnore('.git/config'));
});

test('shouldIgnore - should ignore files matching glob patterns', (t) => {
	t.true(shouldIgnore('file.log'));
	t.true(shouldIgnore('debug.tmp'));
	t.true(shouldIgnore('build.o'));
});

test('shouldIgnore - should ignore hidden files except allowed ones', (t) => {
	t.true(shouldIgnore('.hidden'));
	t.false(shouldIgnore('.env'));
	t.false(shouldIgnore('.gitignore'));
});

test('shouldIgnore - should not ignore regular files', (t) => {
	t.false(shouldIgnore('index.js'));
	t.false(shouldIgnore('README.md'));
	t.false(shouldIgnore('package.json'));
});

test('shouldIgnore - should ignore Python-specific patterns', (t) => {
	t.true(shouldIgnore('__pycache__'));
	t.true(shouldIgnore('file.pyc'));
	t.true(shouldIgnore('.pytest_cache'));
});

test('shouldIgnore - should ignore IDE directories', (t) => {
	t.true(shouldIgnore('.vscode'));
	t.true(shouldIgnore('.idea'));
	t.true(shouldIgnore('*.swp'));
});

test('shouldIgnore - should ignore build directories', (t) => {
	t.true(shouldIgnore('dist'));
	t.true(shouldIgnore('build'));
	t.true(shouldIgnore('target'));
});

test('shouldIgnore - should ignore OS-specific files', (t) => {
	t.true(shouldIgnore('.DS_Store'));
	t.true(shouldIgnore('Thumbs.db'));
	t.true(shouldIgnore('desktop.ini'));
});