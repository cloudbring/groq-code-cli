import test from 'ava';
import sinon from 'sinon';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigManager } from '@src/utils/local-settings';

const mockHomeDir = '/home/user';
const expectedConfigPath = path.join(mockHomeDir, '.groq', 'local-settings.json');

// Sinon stubs for mocked functions
let mockExistsSync: sinon.SinonStub;
let mockReadFileSync: sinon.SinonStub;
let mockWriteFileSync: sinon.SinonStub;
let mockMkdirSync: sinon.SinonStub;
let mockUnlinkSync: sinon.SinonStub;
let mockHomedir: sinon.SinonStub;

test.beforeEach((t) => {
	// Create a new sandbox for each test
	const sandbox = sinon.createSandbox();
	
	// Try to stub fs synchronous operations
	try {
		mockExistsSync = sandbox.stub(fs, 'existsSync');
		mockReadFileSync = sandbox.stub(fs, 'readFileSync');
		mockWriteFileSync = sandbox.stub(fs, 'writeFileSync');
		mockMkdirSync = sandbox.stub(fs, 'mkdirSync');
		mockUnlinkSync = sandbox.stub(fs, 'unlinkSync');
	} catch (e) {
		// If stubbing fails, try to replace the method
		mockExistsSync = sinon.fake();
		mockReadFileSync = sinon.fake();
		mockWriteFileSync = sinon.fake();
		mockMkdirSync = sinon.fake();
		mockUnlinkSync = sinon.fake();
		
		sinon.replace(fs, 'existsSync', mockExistsSync);
		sinon.replace(fs, 'readFileSync', mockReadFileSync);
		sinon.replace(fs, 'writeFileSync', mockWriteFileSync);
		sinon.replace(fs, 'mkdirSync', mockMkdirSync);
		sinon.replace(fs, 'unlinkSync', mockUnlinkSync);
	}
	
	// Create stub for os.homedir
	mockHomedir = sandbox.stub(os, 'homedir');
	mockHomedir.returns(mockHomeDir);
	
	// Store sandbox for cleanup
	(t.context as any).sandbox = sandbox;
});

test.afterEach.always((t) => {
	const sandbox = (t.context as any).sandbox;
	if (sandbox) {
		sandbox.restore();
	}
	sinon.restore();
});

test('ConfigManager constructor - should initialize with correct config path', (t) => {
	const configManager = new ConfigManager();
	t.true(mockHomedir.called);
});

test('getApiKey - should return null when config file does not exist', (t) => {
	mockExistsSync.returns(false);
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
	t.true(mockExistsSync.calledWith(expectedConfigPath));
});

test('getApiKey - should return API key from config file', (t) => {
	const mockConfig = { groqApiKey: 'test-api-key' };
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(mockConfig));
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, 'test-api-key');
	t.true(mockReadFileSync.calledWith(expectedConfigPath, 'utf8'));
});

test('getApiKey - should return null when groqApiKey is not in config', (t) => {
	const mockConfig = { defaultModel: 'some-model' };
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(mockConfig));
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
});

test('getApiKey - should return null and warn on JSON parse error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	mockExistsSync.returns(true);
	mockReadFileSync.returns('invalid json');
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
	t.true(consoleWarnSpy.calledWith('Failed to read config file:', sinon.match.instanceOf(Error)));
	
	consoleWarnSpy.restore();
});

test('setApiKey - should create config directory if it does not exist', (t) => {
	mockExistsSync.returns(false);
	mockMkdirSync.returns(undefined);
	mockWriteFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	t.true(mockMkdirSync.calledWith(
		path.dirname(expectedConfigPath),
		{ recursive: true }
	));
});

test('setApiKey - should create new config file with API key', (t) => {
	mockExistsSync.onFirstCall().returns(true).onSecondCall().returns(false);
	mockWriteFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	t.true(mockWriteFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ groqApiKey: 'new-api-key' }, null, 2),
		{ mode: 0o600 }
	));
});

test('setApiKey - should update existing config file with API key', (t) => {
	const existingConfig = { defaultModel: 'existing-model' };
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(existingConfig));
	mockWriteFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	t.true(mockWriteFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ 
			defaultModel: 'existing-model',
			groqApiKey: 'new-api-key' 
		}, null, 2),
		{ mode: 0o600 }
	));
});

test('setApiKey - should throw error on write failure', (t) => {
	mockExistsSync.returns(true);
	mockWriteFileSync.throws(new Error('Write failed'));
	const configManager = new ConfigManager();

	const error = t.throws(() => configManager.setApiKey('new-api-key'));
	t.truthy(error);
	t.is(error!.message, 'Failed to save API key: Error: Write failed');
});

test('clearApiKey - should do nothing if config file does not exist', (t) => {
	mockExistsSync.returns(false);
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.false(mockReadFileSync.called);
	t.false(mockWriteFileSync.called);
	t.false(mockUnlinkSync.called);
});

test('clearApiKey - should remove API key from config', (t) => {
	const config = { 
		groqApiKey: 'api-key',
		defaultModel: 'model' 
	};
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(config));
	mockWriteFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.true(mockWriteFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ defaultModel: 'model' }, null, 2),
		{ mode: 0o600 }
	));
});

test('clearApiKey - should delete config file if no other properties remain', (t) => {
	const config = { groqApiKey: 'api-key' };
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(config));
	mockUnlinkSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.true(mockUnlinkSync.calledWith(expectedConfigPath));
	t.false(mockWriteFileSync.called);
});

test('clearApiKey - should warn on error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	mockExistsSync.returns(true);
	mockReadFileSync.throws(new Error('Read failed'));
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.true(consoleWarnSpy.calledWith(
		'Failed to clear API key:',
		sinon.match.instanceOf(Error)
	));
	
	consoleWarnSpy.restore();
});

test('getDefaultModel - should return null when config file does not exist', (t) => {
	mockExistsSync.returns(false);
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, null);
});

test('getDefaultModel - should return default model from config', (t) => {
	const config = { defaultModel: 'test-model' };
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(config));
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, 'test-model');
});

test('getDefaultModel - should return null when defaultModel is not in config', (t) => {
	const config = { groqApiKey: 'api-key' };
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(config));
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, null);
});

test('getDefaultModel - should return null and warn on error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	mockExistsSync.returns(true);
	mockReadFileSync.throws(new Error('Read failed'));
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, null);
	t.true(consoleWarnSpy.calledWith(
		'Failed to read default model:',
		sinon.match.instanceOf(Error)
	));
	
	consoleWarnSpy.restore();
});

test('setDefaultModel - should create config directory if it does not exist', (t) => {
	mockExistsSync.returns(false);
	mockMkdirSync.returns(undefined);
	mockWriteFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	t.true(mockMkdirSync.calledWith(
		path.dirname(expectedConfigPath),
		{ recursive: true }
	));
});

test('setDefaultModel - should create new config file with default model', (t) => {
	mockExistsSync.onFirstCall().returns(true).onSecondCall().returns(false);
	mockWriteFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	t.true(mockWriteFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ defaultModel: 'new-model' }, null, 2),
		{ mode: 0o600 }
	));
});

test('setDefaultModel - should update existing config with default model', (t) => {
	const existingConfig = { groqApiKey: 'api-key' };
	mockExistsSync.returns(true);
	mockReadFileSync.returns(JSON.stringify(existingConfig));
	mockWriteFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	t.true(mockWriteFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ 
			groqApiKey: 'api-key',
			defaultModel: 'new-model' 
		}, null, 2),
		{ mode: 0o600 }
	));
});

test('setDefaultModel - should throw error on write failure', (t) => {
	mockExistsSync.returns(true);
	mockWriteFileSync.throws(new Error('Write failed'));
	const configManager = new ConfigManager();

	const error = t.throws(() => configManager.setDefaultModel('new-model'));
	t.truthy(error);
	t.is(error!.message, 'Failed to save default model: Error: Write failed');
});