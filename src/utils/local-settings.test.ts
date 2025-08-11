import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ConfigManager } from './local-settings';

vi.mock('fs');
vi.mock('os');

describe('ConfigManager', () => {
	let configManager: ConfigManager;
	const mockHomeDir = '/home/user';
	const expectedConfigPath = path.join(mockHomeDir, '.groq', 'local-settings.json');

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(os.homedir).mockReturnValue(mockHomeDir);
		configManager = new ConfigManager();
	});

	describe('constructor', () => {
		it('should initialize with correct config path', () => {
			expect(vi.mocked(os.homedir)).toHaveBeenCalled();
		});
	});

	describe('getApiKey', () => {
		it('should return null when config file does not exist', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			const result = configManager.getApiKey();
			
			expect(result).toBeNull();
			expect(fs.existsSync).toHaveBeenCalledWith(expectedConfigPath);
		});

		it('should return API key from config file', () => {
			const mockConfig = { groqApiKey: 'test-api-key' };
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

			const result = configManager.getApiKey();
			
			expect(result).toBe('test-api-key');
			expect(fs.readFileSync).toHaveBeenCalledWith(expectedConfigPath, 'utf8');
		});

		it('should return null when groqApiKey is not in config', () => {
			const mockConfig = { defaultModel: 'some-model' };
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

			const result = configManager.getApiKey();
			
			expect(result).toBeNull();
		});

		it('should return null and warn on JSON parse error', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

			const result = configManager.getApiKey();
			
			expect(result).toBeNull();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'Failed to read config file:',
				expect.any(Error)
			);
			
			consoleWarnSpy.mockRestore();
		});
	});

	describe('setApiKey', () => {
		it('should create config directory if it does not exist', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);
			vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as any);
			vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

			configManager.setApiKey('new-api-key');
			
			expect(fs.mkdirSync).toHaveBeenCalledWith(
				path.dirname(expectedConfigPath),
				{ recursive: true }
			);
		});

		it('should create new config file with API key', () => {
			vi.mocked(fs.existsSync).mockReturnValueOnce(true).mockReturnValueOnce(false);
			vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

			configManager.setApiKey('new-api-key');
			
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expectedConfigPath,
				JSON.stringify({ groqApiKey: 'new-api-key' }, null, 2),
				{ mode: 0o600 }
			);
		});

		it('should update existing config file with API key', () => {
			const existingConfig = { defaultModel: 'existing-model' };
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingConfig));
			vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

			configManager.setApiKey('new-api-key');
			
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expectedConfigPath,
				JSON.stringify({ 
					defaultModel: 'existing-model',
					groqApiKey: 'new-api-key' 
				}, null, 2),
				{ mode: 0o600 }
			);
		});

		it('should throw error on write failure', () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.writeFileSync).mockImplementation(() => {
				throw new Error('Write failed');
			});

			expect(() => configManager.setApiKey('new-api-key')).toThrow(
				'Failed to save API key: Error: Write failed'
			);
		});
	});

	describe('clearApiKey', () => {
		it('should do nothing if config file does not exist', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			configManager.clearApiKey();
			
			expect(fs.readFileSync).not.toHaveBeenCalled();
			expect(fs.writeFileSync).not.toHaveBeenCalled();
			expect(fs.unlinkSync).not.toHaveBeenCalled();
		});

		it('should remove API key from config', () => {
			const config = { 
				groqApiKey: 'api-key',
				defaultModel: 'model' 
			};
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(config));
			vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

			configManager.clearApiKey();
			
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expectedConfigPath,
				JSON.stringify({ defaultModel: 'model' }, null, 2),
				{ mode: 0o600 }
			);
		});

		it('should delete config file if no other properties remain', () => {
			const config = { groqApiKey: 'api-key' };
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(config));
			vi.mocked(fs.unlinkSync).mockImplementation(() => undefined);

			configManager.clearApiKey();
			
			expect(fs.unlinkSync).toHaveBeenCalledWith(expectedConfigPath);
			expect(fs.writeFileSync).not.toHaveBeenCalled();
		});

		it('should warn on error', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error('Read failed');
			});

			configManager.clearApiKey();
			
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'Failed to clear API key:',
				expect.any(Error)
			);
			
			consoleWarnSpy.mockRestore();
		});
	});

	describe('getDefaultModel', () => {
		it('should return null when config file does not exist', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			const result = configManager.getDefaultModel();
			
			expect(result).toBeNull();
		});

		it('should return default model from config', () => {
			const config = { defaultModel: 'test-model' };
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(config));

			const result = configManager.getDefaultModel();
			
			expect(result).toBe('test-model');
		});

		it('should return null when defaultModel is not in config', () => {
			const config = { groqApiKey: 'api-key' };
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(config));

			const result = configManager.getDefaultModel();
			
			expect(result).toBeNull();
		});

		it('should return null and warn on error', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockImplementation(() => {
				throw new Error('Read failed');
			});

			const result = configManager.getDefaultModel();
			
			expect(result).toBeNull();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'Failed to read default model:',
				expect.any(Error)
			);
			
			consoleWarnSpy.mockRestore();
		});
	});

	describe('setDefaultModel', () => {
		it('should create config directory if it does not exist', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);
			vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as any);
			vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

			configManager.setDefaultModel('new-model');
			
			expect(fs.mkdirSync).toHaveBeenCalledWith(
				path.dirname(expectedConfigPath),
				{ recursive: true }
			);
		});

		it('should create new config file with default model', () => {
			vi.mocked(fs.existsSync).mockReturnValueOnce(true).mockReturnValueOnce(false);
			vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

			configManager.setDefaultModel('new-model');
			
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expectedConfigPath,
				JSON.stringify({ defaultModel: 'new-model' }, null, 2),
				{ mode: 0o600 }
			);
		});

		it('should update existing config with default model', () => {
			const existingConfig = { groqApiKey: 'api-key' };
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingConfig));
			vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

			configManager.setDefaultModel('new-model');
			
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expectedConfigPath,
				JSON.stringify({ 
					groqApiKey: 'api-key',
					defaultModel: 'new-model' 
				}, null, 2),
				{ mode: 0o600 }
			);
		});

		it('should throw error on write failure', () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.writeFileSync).mockImplementation(() => {
				throw new Error('Write failed');
			});

			expect(() => configManager.setDefaultModel('new-model')).toThrow(
				'Failed to save default model: Error: Write failed'
			);
		});
	});
});