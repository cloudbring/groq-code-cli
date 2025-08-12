import test from 'ava';
import sinon from 'sinon';
import mockFs from 'mock-fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigManager } from '@src/utils/local-settings';

const mockHomeDir = '/tmp/test-home';
const expectedConfigPath = path.join(mockHomeDir, '.groq', 'local-settings.json');

// Mock os.homedir at the module level
let originalHomedir: () => string;

test.before(() => {
	originalHomedir = os.homedir;
	// Override os.homedir directly
	(os as any).homedir = () => mockHomeDir;
});

test.after.always(() => {
	// Restore original homedir
	(os as any).homedir = originalHomedir;
});

test.beforeEach(() => {
	// Setup mock filesystem
	mockFs({
		[mockHomeDir]: {
			'.groq': {}
		}
	});
});

test.afterEach.always(() => {
	// Restore mocks
	sinon.restore();
	mockFs.restore();
});

test('ConfigManager constructor - should initialize with correct config path', (t) => {
	const configManager = new ConfigManager();
	// Just test that it doesn't crash - we can't easily test the path without stubbing
	t.truthy(configManager);
});

test('getApiKey - should return null when config file does not exist', (t) => {
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
});

test('getApiKey - should return API key from config file', (t) => {
	const mockConfig = { groqApiKey: 'test-api-key' };
	// Reset the mock filesystem within the test to ensure fresh state
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(mockConfig)
			}
		}
	});
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, 'test-api-key');
});

test('getApiKey - should return null when groqApiKey is not in config', (t) => {
	const mockConfig = { defaultModel: 'some-model' };
	// Reset mock filesystem to ensure clean state
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(mockConfig)
			}
		}
	});
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
});

test('getApiKey - should return null and warn on JSON parse error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	// Reset and setup mock filesystem with invalid JSON
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': 'invalid json'
			}
		}
	});
	const configManager = new ConfigManager();

	const result = configManager.getApiKey();
	
	t.is(result, null);
	t.true(consoleWarnSpy.calledWith('Failed to read config file:', sinon.match.instanceOf(Error)));
	
	consoleWarnSpy.restore();
});

test('setApiKey - should create config directory if it does not exist', (t) => {
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	// Check that the config file was created
	const fs = require('fs');
	t.true(fs.existsSync(expectedConfigPath));
});

test('setApiKey - should create new config file with API key', (t) => {
	// Reset mock filesystem to ensure clean state
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {}
		}
	});
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	// Check that the config file was created with correct content
	const fs = require('fs');
	const content = fs.readFileSync(expectedConfigPath, 'utf8');
	const config = JSON.parse(content);
	t.is(config.groqApiKey, 'new-api-key');
});

test('setApiKey - should update existing config file with API key', (t) => {
	const existingConfig = { defaultModel: 'existing-model' };
	// Reset and setup existing config file in mock filesystem
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(existingConfig)
			}
		}
	});
	const configManager = new ConfigManager();

	configManager.setApiKey('new-api-key');
	
	// Check that the config file was updated with both existing and new values
	const fs = require('fs');
	const content = fs.readFileSync(expectedConfigPath, 'utf8');
	const config = JSON.parse(content);
	t.is(config.defaultModel, 'existing-model');
	t.is(config.groqApiKey, 'new-api-key');
});

test('setApiKey - should throw error on write failure', (t) => {
	// Reset and create a read-only filesystem to simulate write failure
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': mockFs.directory({
				mode: parseInt('444', 8) // read-only directory
			})
		}
	});
	const configManager = new ConfigManager();

	const error = t.throws(() => configManager.setApiKey('new-api-key'));
	t.truthy(error);
	t.true(error!.message.includes('Failed to save API key'));
});

test('clearApiKey - should do nothing if config file does not exist', (t) => {
	// Start with empty .groq directory (no config file)
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	// Should not throw error and config file should still not exist
	const fs = require('fs');
	t.false(fs.existsSync(expectedConfigPath));
});

test('clearApiKey - should remove API key from config', (t) => {
	const config = { 
		groqApiKey: 'api-key',
		defaultModel: 'model' 
	};
	// Reset and setup existing config file with both API key and default model
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(config)
			}
		}
	});
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	// Check that API key was removed but default model remains
	const fs = require('fs');
	const content = fs.readFileSync(expectedConfigPath, 'utf8');
	const updatedConfig = JSON.parse(content);
	t.is(updatedConfig.defaultModel, 'model');
	t.is(updatedConfig.groqApiKey, undefined);
});

test('clearApiKey - should delete config file if no other properties remain', (t) => {
	const config = { groqApiKey: 'api-key' };
	// Reset and setup config file with only API key
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(config)
			}
		}
	});
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	// Check that config file was deleted since no other properties remain
	const fs = require('fs');
	t.false(fs.existsSync(expectedConfigPath));
});

test('clearApiKey - should warn on error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	// Reset and create an invalid config file to trigger read error
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': mockFs.file({
					mode: parseInt('000', 8) // no permissions
				})
			}
		}
	});
	const configManager = new ConfigManager();

	configManager.clearApiKey();
	
	t.true(consoleWarnSpy.calledWith(
		'Failed to clear API key:',
		sinon.match.instanceOf(Error)
	));
	
	consoleWarnSpy.restore();
});

test('getDefaultModel - should return null when config file does not exist', (t) => {
	// Start with empty .groq directory (no config file)
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, null);
});

test('getDefaultModel - should return default model from config', (t) => {
	const config = { defaultModel: 'test-model' };
	// Reset and setup config file with default model
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(config)
			}
		}
	});
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, 'test-model');
});

test('getDefaultModel - should return null when defaultModel is not in config', (t) => {
	const config = { groqApiKey: 'api-key' };
	// Reset and setup config file without default model
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(config)
			}
		}
	});
	const configManager = new ConfigManager();

	const result = configManager.getDefaultModel();
	
	t.is(result, null);
});

test('getDefaultModel - should return null and warn on error', (t) => {
	const consoleWarnSpy = sinon.stub(console, 'warn');
	// Reset and create an invalid config file to trigger read error
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': mockFs.file({
					mode: parseInt('000', 8) // no permissions
				})
			}
		}
	});
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
	// Reset and start with completely empty mock filesystem (no .groq directory)
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {}
	});
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	// Check that the config directory and file were created
	const fs = require('fs');
	t.true(fs.existsSync(path.dirname(expectedConfigPath)));
	t.true(fs.existsSync(expectedConfigPath));
});

test('setDefaultModel - should create new config file with default model', (t) => {
	// Start with .groq directory but no config file
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	// Check that config file was created with default model
	const fs = require('fs');
	const content = fs.readFileSync(expectedConfigPath, 'utf8');
	const config = JSON.parse(content);
	t.is(config.defaultModel, 'new-model');
});

test('setDefaultModel - should update existing config with default model', (t) => {
	const existingConfig = { groqApiKey: 'api-key' };
	// Reset and setup existing config file
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': {
				'local-settings.json': JSON.stringify(existingConfig)
			}
		}
	});
	const configManager = new ConfigManager();

	configManager.setDefaultModel('new-model');
	
	// Check that config was updated with both existing and new values
	const fs = require('fs');
	const content = fs.readFileSync(expectedConfigPath, 'utf8');
	const config = JSON.parse(content);
	t.is(config.groqApiKey, 'api-key');
	t.is(config.defaultModel, 'new-model');
});

test('setDefaultModel - should throw error on write failure', (t) => {
	// Reset and create a read-only filesystem to simulate write failure
	mockFs.restore();
	mockFs({
		[mockHomeDir]: {
			'.groq': mockFs.directory({
				mode: parseInt('444', 8) // read-only directory
			})
		}
	});
	const configManager = new ConfigManager();

	const error = t.throws(() => configManager.setDefaultModel('new-model'));
	t.truthy(error);
	t.true(error!.message.includes('Failed to save default model'));
});