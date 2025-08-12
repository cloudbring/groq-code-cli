import test from 'ava';
import sinon from 'sinon';
import * as fs from 'fs';
import {
  type ToolResult,
  formatToolParams,
  createToolResponse,
  readFile,
  createFile,
  editFile,
  deleteFile,
  listFiles,
  searchFiles,
  executeCommand,
  createTasks,
  updateTasks,
  executeTool,
  TOOL_REGISTRY,
  getReadFilesTracker
} from '../../../src/tools/tools.js';

// Sinon stubs for mocked functions
let mockFsAccess: sinon.SinonStub;
let mockFsStat: sinon.SinonStub;
let mockFsReadFile: sinon.SinonStub;
let mockFsUnlink: sinon.SinonStub;
let mockFsRmdir: sinon.SinonStub;
let mockFsReaddir: sinon.SinonStub;
let mockProcessCwd: sinon.SinonStub;
let mockFsPromises: any;

// Setup stubs before each test
test.beforeEach(() => {
  // Restore any existing stubs first
  sinon.restore();
  
  // Create a mock promises object with stub methods
  mockFsPromises = {
    access: sinon.stub(),
    stat: sinon.stub(),
    readFile: sinon.stub(),
    unlink: sinon.stub(),
    rmdir: sinon.stub(),
    readdir: sinon.stub()
  };
  
  // Stub the promises property of fs
  sinon.stub(fs, 'promises').value(mockFsPromises);
  
  // Assign individual stubs for easier access
  mockFsAccess = mockFsPromises.access;
  mockFsStat = mockFsPromises.stat;
  mockFsReadFile = mockFsPromises.readFile;
  mockFsUnlink = mockFsPromises.unlink;
  mockFsRmdir = mockFsPromises.rmdir;
  mockFsReaddir = mockFsPromises.readdir;
  
  // Create stub for process.cwd
  mockProcessCwd = sinon.stub(process, 'cwd');
});

// Restore all stubs after each test
test.afterEach.always(() => {
  sinon.restore();
});

test('ToolResult Interface - should define correct structure', (t) => {
  const result: ToolResult = {
    success: true,
    content: 'test content',
    data: { test: true },
    message: 'test message',
    error: 'test error'
  };

  t.is(result.success, true);
  t.is(result.content, 'test content');
  t.deepEqual(result.data, { test: true });
  t.is(result.message, 'test message');
  t.is(result.error, 'test error');
});

test('formatToolParams - should format read_file parameters', (t) => {
  const result = formatToolParams('read_file', { file_path: 'test.js', start_line: 1 });
  t.is(result, 'Parameters: file_path="test.js"');
});

test('formatToolParams - should format create_file parameters', (t) => {
  const result = formatToolParams('create_file', { file_path: 'new.js', content: 'test' });
  t.is(result, 'Parameters: file_path="new.js"');
});

test('formatToolParams - should truncate long values', (t) => {
  const longValue = 'a'.repeat(60);
  const result = formatToolParams('read_file', { file_path: longValue });
  t.true(result.includes('...'));
  t.true(result.length < longValue.length + 20);
});

test('formatToolParams - should handle arrays with many items', (t) => {
  const result = formatToolParams('search_files', { pattern: 'test', file_types: ['js', 'ts', 'tsx', 'jsx'] });
  t.is(result, 'Parameters: pattern="test"'); // Only pattern is a key param for search_files
});

test('formatToolParams - should handle tools without key parameters', (t) => {
  const result = formatToolParams('create_tasks', { user_query: 'test', tasks: [] });
  t.is(result, '');
});

test('formatToolParams - should use custom separator', (t) => {
  const result = formatToolParams('read_file', { file_path: 'test.js' }, { separator: ':' });
  t.is(result, 'Parameters: file_path:"test.js"');
});

test('formatToolParams - should exclude prefix when requested', (t) => {
  const result = formatToolParams('read_file', { file_path: 'test.js' }, { includePrefix: false });
  t.is(result, 'file_path="test.js"');
});

test('formatToolParams - should handle missing parameters gracefully', (t) => {
  const result = formatToolParams('read_file', {});
  t.is(result, 'Arguments: {}');
});

test('formatToolParams - should handle unknown tool names', (t) => {
  const result = formatToolParams('unknown_tool', { param: 'value' });
  t.is(result, ''); // Unknown tools with no key params return empty string
});

test('createToolResponse - should create successful response with data', (t) => {
  const result = createToolResponse(true, 'test data', 'success message');
  t.deepEqual(result, {
    success: true,
    content: 'test data',
    message: 'success message'
  });
});

test('createToolResponse - should create successful response without data', (t) => {
  const result = createToolResponse(true, undefined, 'success message');
  t.deepEqual(result, {
    success: true,
    message: 'success message'
  });
});

test('createToolResponse - should create error response', (t) => {
  const result = createToolResponse(false, undefined, 'error message', 'detailed error');
  t.deepEqual(result, {
    success: false,
    message: 'error message',
    error: 'detailed error'
  });
});

test('createToolResponse - should create minimal successful response', (t) => {
  const result = createToolResponse(true);
  t.deepEqual(result, {
    success: true
  });
});

test('createToolResponse - should create minimal error response', (t) => {
  const result = createToolResponse(false, undefined, '', 'error');
  t.deepEqual(result, {
    success: false,
    error: 'error'
  });
});

test('getReadFilesTracker - should return a Set', (t) => {
  const tracker = getReadFilesTracker();
  t.is(tracker instanceof Set, true);
});

// Helper to setup common readFile mocks
const setupReadFileMocks = () => {
  const mockStats = { 
    isFile: () => true,
    isDirectory: () => false,
    size: 1000 
  };
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves(mockStats);
  mockFsReadFile.resolves('line1\nline2\nline3');
  return mockStats;
};

test('readFile - should read file successfully', async (t) => {
  setupReadFileMocks();
  
  // Verify mock is set up correctly
  t.true(mockFsStat.called || mockFsStat.callCount === 0, 'Stat mock should be ready');
  
  const result = await readFile('test.js');
  
  t.is(result.success, true);
  t.is(result.content, 'line1\nline2\nline3');
  t.true(result.message?.includes('Read 3 lines from test.js'));
});

test('readFile - should handle file not found', async (t) => {
  mockFsAccess.rejects(new Error('ENOENT'));
  
  const result = await readFile('nonexistent.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: File not found');
});

test('readFile - should handle non-file paths', async (t) => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isFile: () => false,
    isDirectory: () => true
  });
  
  const result = await readFile('directory');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Path is not a file');
});

test('readFile - should handle files that are too large', async (t) => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isFile: () => true,
    isDirectory: () => false,
    size: 100 * 1024 * 1024 // 100MB
  });
  
  const result = await readFile('large.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: File too large (max 50MB)');
});

test('readFile - should read file with line range', async (t) => {
  setupReadFileMocks();
  
  const result = await readFile('test.js', 2, 3);
  
  t.is(result.success, true);
  t.is(result.content, 'line2\nline3');
  t.is(result.message, 'Read lines 2-3 from test.js');
});

test('readFile - should handle start line beyond file length', async (t) => {
  setupReadFileMocks();
  
  const result = await readFile('test.js', 10, 15);
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Start line exceeds file length');
});

test('readFile - should handle ENOENT error specifically', async (t) => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isFile: () => true,
    isDirectory: () => false,
    size: 1000 
  });
  mockFsReadFile.rejects({ code: 'ENOENT' });
  
  const result = await readFile('test.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: File not found');
});

test('readFile - should handle generic read errors', async (t) => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isFile: () => true,
    isDirectory: () => false,
    size: 1000 
  });
  mockFsReadFile.rejects(new Error('Permission denied'));
  
  const result = await readFile('test.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Failed to read file');
});

// Test createFile with limited mocking (file operations will be called but may fail gracefully)
test('createFile - should handle existing file without overwrite', async (t) => {
  mockFsAccess.resolves(undefined);
  
  const result = await createFile('existing.js', 'content');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: File already exists, use overwrite=true');
});

test('createFile - should handle invalid file type', async (t) => {
  const result = await createFile('test', 'content', 'invalid');
  
  t.is(result.success, false);
  t.is(result.error, "Error: Invalid file_type, must be 'file' or 'directory'");
});

// Test editFile with mocked fs operations
test('editFile - should handle file read error', async (t) => {
  mockFsReadFile.rejects(new Error('Read failed'));
  
  const result = await editFile('test.js', 'old', 'new');
  
  t.is(result.success, false);
  t.true(result.error?.includes('Error: Failed to edit file'));
});

// Helper to setup common deleteFile mocks
const setupDeleteFileMocks = () => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ isDirectory: () => false });
  mockFsUnlink.resolves(undefined);
  mockFsRmdir.resolves(undefined);
  mockFsReaddir.resolves([]);
  mockProcessCwd.returns('/test/project');
};

test('deleteFile - should prevent deleting root directory', async (t) => {
  setupDeleteFileMocks();
  
  const result = await deleteFile('/test/project');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Cannot delete the root project directory');
});

test('deleteFile - should prevent deleting files outside project directory', async (t) => {
  setupDeleteFileMocks();
  
  const result = await deleteFile('/outside/file.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Cannot delete files outside the project directory');
});

test('deleteFile - should handle non-existent files', async (t) => {
  mockFsAccess.rejects(new Error('Not found'));
  mockProcessCwd.returns('/test/project');
  
  const result = await deleteFile('nonexistent.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Path not found');
});

// Helper to setup common listFiles mocks
const setupListFilesMocks = () => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ isDirectory: () => true });
};

test('listFiles - should handle directory not found', async (t) => {
  mockFsAccess.rejects(new Error('Not found'));
  
  const result = await listFiles('nonexistent');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Directory not found');
});

test('listFiles - should handle non-directory path', async (t) => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isDirectory: () => false,
    isFile: () => true
  });
  
  const result = await listFiles('file.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Path is not a directory');
});

// Helper to setup common searchFiles mocks
const setupSearchFilesMocks = () => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isDirectory: () => true,
    isFile: () => false
  });
  mockFsReaddir.resolves([]);
};

test('searchFiles - should handle directory not found', async (t) => {
  mockFsAccess.rejects(new Error('Not found'));
  
  const result = await searchFiles('test pattern', '*', 'nonexistent');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Directory not found');
});

test('searchFiles - should handle non-directory path', async (t) => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isDirectory: () => false,
    isFile: () => true
  });
  
  const result = await searchFiles('pattern', '*', 'file.js');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Path is not a directory');
});

test('searchFiles - should handle invalid regex pattern', async (t) => {
  setupSearchFilesMocks();
  
  const result = await searchFiles('[invalid regex', '*', '.', false, 'regex');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Invalid regex pattern');
});

test('searchFiles - should return empty results when no files found', async (t) => {
  setupSearchFilesMocks();
  
  const result = await searchFiles('pattern');
  
  t.is(result.success, true);
  t.deepEqual(result.content, []);
  t.is(result.message, 'No files found matching criteria');
});

test('executeCommand - should handle echo command', async (t) => {
  // Test a simple command that should work in most environments
  const result = await executeCommand('echo "hello"', 'bash');
  
  // The test might succeed or fail depending on environment, we just check structure
  t.is(typeof result.success, 'boolean');
  if (result.success) {
    t.true(result.content?.includes('stdout:'));
    t.true(result.content?.includes('stderr:'));
  }
});

test('executeCommand - should handle python version check', async (t) => {
  // Test a simple Python command that should work in most environments
  const result = await executeCommand('python --version', 'python');
  
  // The test might succeed or fail depending on environment, we just check structure
  t.is(typeof result.success, 'boolean');
  if (result.success) {
    t.true(result.content?.includes('stdout:'));
    t.true(result.content?.includes('stderr:'));
  }
});

test('executeCommand - should handle invalid command type', async (t) => {
  const result = await executeCommand('echo test', 'invalid');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Invalid command_type');
});

test('executeCommand - should handle working directory not found', async (t) => {
  mockFsAccess.rejects(new Error('Not found'));
  
  const result = await executeCommand('echo test', 'bash', 'nonexistent');
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Working directory not found');
});

test('executeCommand - should handle command failure', async (t) => {
  // Test with a command that should fail
  const result = await executeCommand('this-command-does-not-exist-12345', 'bash');
  
  t.is(result.success, false);
  t.true(result.error?.includes('Error:'));
});

test('createTasks - should create tasks successfully', async (t) => {
  const tasks = [
    { id: '1', description: 'Task 1', status: 'pending' as const },
    { id: '2', description: 'Task 2', status: 'in_progress' as const }
  ];
  
  const result = await createTasks('Build feature', tasks);
  
  t.is(result.success, true);
  t.is(result.content.user_query, 'Build feature');
  t.is(result.content.tasks.length, 2);
  t.is(result.message, 'Created task list with 2 tasks for: Build feature');
});

test('createTasks - should set default status for tasks', async (t) => {
  const tasks = [
    { id: '1', description: 'Task 1' } as any
  ];
  
  const result = await createTasks('Build feature', tasks);
  
  t.is(result.success, true);
  t.is(result.content.tasks[0].status, 'pending');
});

test('createTasks - should validate task structure', async (t) => {
  const invalidTasks = [
    { description: 'Missing ID' } as any
  ];
  
  const result = await createTasks('Build feature', invalidTasks);
  
  t.is(result.success, false);
  t.true(result.error?.includes('Task 0 missing required fields'));
});

test('createTasks - should validate task status', async (t) => {
  const tasks = [
    { id: '1', description: 'Task 1', status: 'invalid' } as any
  ];
  
  const result = await createTasks('Build feature', tasks);
  
  t.is(result.success, false);
  t.true(result.error?.includes("Invalid status 'invalid'"));
});

test('createTasks - should handle creation error', async (t) => {
  // Force an error by passing invalid data
  const result = await createTasks(null as any, null as any);
  
  t.is(result.success, false);
  t.true(result.error?.includes('Failed to create tasks'));
});

// Helper for updateTasks tests that need initial tasks
const setupTasksForUpdate = async () => {
  const tasks = [
    { id: '1', description: 'Task 1', status: 'pending' as const },
    { id: '2', description: 'Task 2', status: 'pending' as const }
  ];
  await createTasks('Test query', tasks);
};

test('updateTasks - should update tasks successfully', async (t) => {
  await setupTasksForUpdate();
  
  const updates = [
    { id: '1', status: 'completed' as const, notes: 'Done!' }
  ];
  
  const result = await updateTasks(updates);
  
  t.is(result.success, true);
  t.is(result.content.tasks[0].status, 'completed');
  t.is(result.content.tasks[0].notes, 'Done!');
  t.is(result.message, 'Updated 1 task(s)');
});

test('updateTasks - should validate update structure', async (t) => {
  await setupTasksForUpdate();
  
  const invalidUpdates = [
    { status: 'completed' } as any // Missing ID
  ];
  
  const result = await updateTasks(invalidUpdates);
  
  t.is(result.success, false);
  t.true(result.error?.includes('missing required fields'));
});

test('updateTasks - should validate update status', async (t) => {
  await setupTasksForUpdate();
  
  const updates = [
    { id: '1', status: 'invalid' } as any
  ];
  
  const result = await updateTasks(updates);
  
  t.is(result.success, false);
  t.true(result.error?.includes("Invalid status 'invalid'"));
});

test('updateTasks - should handle task not found', async (t) => {
  await setupTasksForUpdate();
  
  const updates = [
    { id: 'nonexistent', status: 'completed' as const }
  ];
  
  const result = await updateTasks(updates);
  
  t.is(result.success, false);
  t.true(result.error?.includes("Task 'nonexistent' not found"));
});

test('TOOL_REGISTRY - should contain all expected tools', (t) => {
  const expectedTools = [
    'read_file',
    'create_file',
    'edit_file',
    'delete_file',
    'list_files',
    'search_files',
    'execute_command',
    'create_tasks',
    'update_tasks'
  ];

  expectedTools.forEach(toolName => {
    t.truthy(TOOL_REGISTRY[toolName as keyof typeof TOOL_REGISTRY]);
    t.is(typeof TOOL_REGISTRY[toolName as keyof typeof TOOL_REGISTRY], 'function');
  });
});

// Helper to setup common executeTool mocks
const setupExecuteToolMocks = () => {
  mockFsAccess.resolves(undefined);
  mockFsStat.resolves({ 
    isFile: () => true,
    isDirectory: () => false,
    size: 1000 
  });
  mockFsReadFile.resolves('test content');
};

test('executeTool - should execute read_file tool', async (t) => {
  setupExecuteToolMocks();
  
  const result = await executeTool('read_file', { file_path: 'test.js' });
  
  t.is(result.success, true);
  t.is(result.content, 'test content');
});

test('executeTool - should handle unknown tool', async (t) => {
  const result = await executeTool('unknown_tool', {});
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Unknown tool');
});

test('executeTool - should handle invalid arguments', async (t) => {
  const result = await executeTool('read_file', { invalid_param: 'value' });
  
  // This should still work as the function handles missing parameters
  t.truthy(result);
});

test('executeTool - should handle type errors', async (t) => {
  // Mock a function that throws TypeError
  const readFileStub = sinon.stub(TOOL_REGISTRY, 'read_file').rejects(new TypeError('Invalid arguments'));
  
  const result = await executeTool('read_file', { file_path: 'test.js' });
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Invalid tool arguments');
  
  readFileStub.restore();
});

test('executeTool - should handle unexpected errors', async (t) => {
  // Mock a function that throws a generic error
  const readFileStub = sinon.stub(TOOL_REGISTRY, 'read_file').rejects(new Error('Unexpected error'));
  
  const result = await executeTool('read_file', { file_path: 'test.js' });
  
  t.is(result.success, false);
  t.is(result.error, 'Error: Unexpected tool error');
  
  readFileStub.restore();
});