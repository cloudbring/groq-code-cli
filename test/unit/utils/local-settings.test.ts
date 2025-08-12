import test from 'ava';
import sinon from 'sinon';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigManager } from '@src/utils/local-settings';

const mockHomeDir = '/home/user';
const expectedConfigPath = path.join(mockHomeDir, '.groq', 'local-settings.json');

// Create stubs for all fs methods we need
const fsStubs = {
	existsSync: sinon.stub(),
	readFileSync: sinon.stub(),
	writeFileSync: sinon.stub(),
	mkdirSync: sinon.stub(),
	unlinkSync: sinon.stub(),
};

const osStubs = {
	homedir: sinon.stub(),
};

// Replace fs and os methods
Object.defineProperty(fs, 'existsSync', { value: fsStubs.existsSync, writable: false });
Object.defineProperty(fs, 'readFileSync', { value: fsStubs.readFileSync, writable: false });
Object.defineProperty(fs, 'writeFileSync', { value: fsStubs.writeFileSync, writable: false });
Object.defineProperty(fs, 'mkdirSync', { value: fsStubs.mkdirSync, writable: false });
Object.defineProperty(fs, 'unlinkSync', { value: fsStubs.unlinkSync, writable: false });

Object.defineProperty(os, 'homedir', { value: osStubs.homedir, writable: false });

test.beforeEach(() => {
	sinon.restore();
	// Reset all stubs
	Object.values(fsStubs).forEach(stub => stub.reset());
	Object.values(osStubs).forEach(stub => stub.reset());
	osStubs.homedir.returns(mockHomeDir);
});

test('ConfigManager constructor - should initialize with correct config path', (t) => {
	const configManager = new ConfigManager();
	t.true(osStubs.homedir.called);
});

test('getApiKey - should return null when config file does not exist', (t) => {
	fsStubs.existsSync.returns(false);
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
	t.true(fsStubs.existsSync.calledWith(expectedConfigPath));
});

test('getApiKey - should return API key from config file', (t) => {
	const mockConfig = { groqApiKey: 'test-api-key' };
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(mockConfig));
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, 'test-api-key');
	t.true(fsStubs.readFileSync.calledWith(expectedConfigPath, 'utf8'));
});

test('getApiKey - should return null when groqApiKey is not in config', (t) => {
	const mockConfig = { defaultModel: 'some-model' };
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(mockConfig));
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
});

test('getApiKey - should return null and warn on JSON parse error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns('invalid json');
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
	t.true(consoleWarnSpy.calledWith('Failed to read config file:', sinon.match.instanceOf(Error)));
	
	consoleWarnSpy.restore();
});

test('setApiKey - should create config directory if it does not exist', (t) => {
	fsStubs.existsSync.returns(false);
	fsStubs.mkdirSync.returns(undefined);
	fsStubs.writeFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	t.true(fsStubs.mkdirSync.calledWith(
		path.dirname(expectedConfigPath),
		{ recursive: true }
	));
});

test('setApiKey - should create new config file with API key', (t) => {
	fsStubs.existsSync.onFirstCall().returns(true).onSecondCall().returns(false);
	fsStubs.writeFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	t.true(fsStubs.writeFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ groqApiKey: 'new-api-key' }, null, 2),
		{ mode: 0o600 }
	));
});

test('setApiKey - should update existing config file with API key', (t) => {
	const existingConfig = { defaultModel: 'existing-model' };
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(existingConfig));
	fsStubs.writeFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	t.true(fsStubs.writeFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ 
			defaultModel: 'existing-model',
			groqApiKey: 'new-api-key' 
		}, null, 2),
		{ mode: 0o600 }
	));
});

test('setApiKey - should throw error on write failure', (t) => {
	fsStubs.existsSync.returns(true);
	fsStubs.writeFileSync.throws(new Error('Write failed'));
	const configManager = new ConfigManager();

	const error = t.throws(() => configManager.setApiKey('new-api-key'));
	t.truthy(error);
	t.is(error!.message, 'Failed to save API key: Error: Write failed');
});

test('clearApiKey - should do nothing if config file does not exist', (t) => {
	fsStubs.existsSync.returns(false);
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.false(fsStubs.readFileSync.called);
	t.false(fsStubs.writeFileSync.called);
	t.false(fsStubs.unlinkSync.called);
});

test('clearApiKey - should remove API key from config', (t) => {
	const config = { 
		groqApiKey: 'api-key',
		defaultModel: 'model' 
	};
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(config));
	fsStubs.writeFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.true(fsStubs.writeFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ defaultModel: 'model' }, null, 2),
		{ mode: 0o600 }
	));
});

test('clearApiKey - should delete config file if no other properties remain', (t) => {
	const config = { groqApiKey: 'api-key' };
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(config));
	fsStubs.unlinkSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.true(fsStubs.unlinkSync.calledWith(expectedConfigPath));
	t.false(fsStubs.writeFileSync.called);
});

test('clearApiKey - should warn on error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.throws(new Error('Read failed'));
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.true(consoleWarnSpy.calledWith(
		'Failed to clear API key:',
		sinon.match.instanceOf(Error)
	));
	
	consoleWarnSpy.restore();
});

test('getDefaultModel - should return null when config file does not exist', (t) => {
	fsStubs.existsSync.returns(false);
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, null);
});

test('getDefaultModel - should return default model from config', (t) => {
	const config = { defaultModel: 'test-model' };
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(config));
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, 'test-model');
});

test('getDefaultModel - should return null when defaultModel is not in config', (t) => {
	const config = { groqApiKey: 'api-key' };
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(config));
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, null);
});

test('getDefaultModel - should return null and warn on error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.throws(new Error('Read failed'));
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
	fsStubs.existsSync.returns(false);
	fsStubs.mkdirSync.returns(undefined);
	fsStubs.writeFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	t.true(fsStubs.mkdirSync.calledWith(
		path.dirname(expectedConfigPath),
		{ recursive: true }
	));
});

test('setDefaultModel - should create new config file with default model', (t) => {
	fsStubs.existsSync.onFirstCall().returns(true).onSecondCall().returns(false);
	fsStubs.writeFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	t.true(fsStubs.writeFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ defaultModel: 'new-model' }, null, 2),
		{ mode: 0o600 }
	));
});

test('setDefaultModel - should update existing config with default model', (t) => {
	const existingConfig = { groqApiKey: 'api-key' };
	fsStubs.existsSync.returns(true);
	fsStubs.readFileSync.returns(JSON.stringify(existingConfig));
	fsStubs.writeFileSync.returns(undefined);
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	t.true(fsStubs.writeFileSync.calledWith(
		expectedConfigPath,
		JSON.stringify({ 
			groqApiKey: 'api-key',
			defaultModel: 'new-model' 
		}, null, 2),
		{ mode: 0o600 }
	));
});

test('setDefaultModel - should throw error on write failure', (t) => {
	fsStubs.existsSync.returns(true);
	fsStubs.writeFileSync.throws(new Error('Write failed'));
	const configManager = new ConfigManager();

	const error = t.throws(() => configManager.setDefaultModel('new-model'));
	t.truthy(error);
	t.is(error!.message, 'Failed to save default model: Error: Write failed');
});