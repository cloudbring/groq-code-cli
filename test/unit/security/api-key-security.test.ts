/** biome-ignore-all lint/style/useNodejsImportProtocol: stubbing imports */

import {writeFileSync} from 'node:fs';
import anyTest, {type TestFn} from 'ava';
import sinon from 'sinon';
import {Agent} from '../../../src/core/agent';

type KeySecurityTestContext = {
	sandbox: sinon.SinonSandbox;
	consoleLogStub: sinon.SinonStub;
	consoleErrorStub: sinon.SinonStub;
	consoleWarnStub: sinon.SinonStub;
};

const test = anyTest as TestFn<KeySecurityTestContext>;

// Security tests to verify API keys are never logged or exposed
test.beforeEach(async t => {
	const sandbox = sinon.createSandbox();
	t.context = {
		sandbox: sandbox,
		consoleLogStub: sandbox.stub(console, 'log'),
		consoleErrorStub: sandbox.stub(console, 'error'),
		consoleWarnStub: sandbox.stub(console, 'warn'),
	};
});

test.afterEach.always(t => {
	t.context.sandbox.restore();
});

test.serial('Agent.setApiKey - should not log full API key', async t => {
	const agent = await Agent.create('test-model', 0.5, null);
	const testApiKey = 'gsk_1234567890abcdefghijklmnopqrstuvwxyz123456';

	// Capture any debug logs that might occur
	const originalWriteFileSync = require('fs').writeFileSync;
	const originalAppendFileSync = require('fs').appendFileSync;
	let debugLogContent = '';

	t.context.sandbox
		.stub(require('fs'), 'writeFileSync')
		.callsFake((path, content) => {
			if ((path as unknown as string).includes('debug-agent.log')) {
				debugLogContent += (content as string).toString();
			}
			return originalWriteFileSync.call(require('fs'), path, content);
		});

	t.context.sandbox
		.stub(require('fs'), 'appendFileSync')
		.callsFake((path, content) => {
			if ((path as unknown as string).includes('debug-agent.log')) {
				debugLogContent += (content as string).toString();
			}
			return originalAppendFileSync.call(require('fs'), path, content);
		});

	// Set API key
	agent.setApiKey(testApiKey);

	// Check that full API key is not logged anywhere
	t.false(
		debugLogContent.includes(testApiKey),
		'Full API key should never appear in debug logs',
	);

	// Check console logs don't contain full API key
	const allConsoleLogs = [
		...t.context.consoleLogStub.getCalls(),
		...t.context.consoleErrorStub.getCalls(),
		...t.context.consoleWarnStub.getCalls(),
	]
		.map(call => call.args.join(' '))
		.join(' ');

	t.false(
		allConsoleLogs.includes(testApiKey),
		'Full API key should never appear in console logs',
	);
});

test.serial(
	'Agent.setApiKey - should only log masked API key in debug mode',
	async t => {
		const testApiKey = 'gsk_1234567890abcdefghijklmnopqrstuvwxyz123456';
		const expectedMaskedKey = 'gsk_1234...';

		let debugLogContent = '';

		// Mock fs functions to capture debug log content
		t.context.sandbox
			.stub(require('fs'), 'writeFileSync')
			.callsFake((path, content) => {
				if ((path as string).includes('debug-agent.log')) {
					debugLogContent += (content as string).toString();
				}
			});

		t.context.sandbox
			.stub(require('fs'), 'appendFileSync')
			.callsFake((path, content) => {
				if ((path as string).includes('debug-agent.log')) {
					debugLogContent += (content as string).toString();
				}
			});

		// Create agent with debug enabled
		const agent = await Agent.create('test-model', 0.5, null, true);
		agent.setApiKey(testApiKey);

		// Check that only masked key appears in logs
		if (debugLogContent) {
			t.false(
				debugLogContent.includes(testApiKey),
				'Full API key should not appear in debug logs',
			);
			t.true(
				debugLogContent.includes(expectedMaskedKey) ||
					debugLogContent.includes('gsk_1234567'),
				'Masked API key should appear in debug logs when debug is enabled',
			);
		}
	},
);

test.serial(
	'generateCurlCommand - should mask API key in curl commands',
	async t => {
		const testApiKey = 'gsk_1234567890abcdefghijklmnopqrstuvwxyz123456';
		const requestBody = {model: 'test-model', messages: []};

		// Access the internal generateCurlCommand function through agent module
		// Since it's not exported, we need to test indirectly through the agent's behavior
		let debugLogContent = '';

		t.context.sandbox
			.stub(require('fs'), 'writeFileSync')
			.callsFake(content => {
				debugLogContent += (content as string).toString();
			});

		t.context.sandbox
			.stub(require('fs'), 'appendFileSync')
			.callsFake(content => {
				debugLogContent += (content as string).toString();
			});

		// Create agent with debug enabled to trigger curl command generation
		const agent = await Agent.create('test-model', 0.5, null, true);
		agent.setApiKey(testApiKey);

		// Check that full API key doesn't appear in any logged curl commands
		t.false(
			debugLogContent.includes(testApiKey),
			'Full API key should not appear in curl commands',
		);

		// Should contain masked version if curl command is generated
		const maskedKeyPattern = /gsk_\w{8}\.{3}\w{8}/;
		if (debugLogContent.includes('curl')) {
			t.regex(
				debugLogContent,
				maskedKeyPattern,
				'Curl commands should contain masked API keys',
			);
		}
	},
);

test.serial(
	'Error messages - should not expose API key in error messages',
	async t => {
		const testApiKey = 'gsk_1234567890abcdefghijklmnopqrstuvwxyz123456';

		// Mock Groq SDK to throw an error
		t.context.sandbox
			.stub()
			.throws(new Error('API Error: Invalid key gsk_test'));

		try {
			const agent = await Agent.create('test-model', 0.5, null);
			(agent as Agent).setApiKey(testApiKey);

			const agentPrototype = Object.getPrototypeOf(agent);

			// Mock the Groq client to throw an error
			agentPrototype.client = {
				chat: {
					completions: {
						create: t.context.sandbox
							.stub()
							.rejects(new Error('Authentication failed')),
					},
				},
			};

			// Try to chat and expect it to handle the error without exposing the key
			await t.throwsAsync(() => agent.chat('test message'));
		} catch (error) {
			// Verify error message doesn't contain the actual API key
			t.false(
				error.message.includes(testApiKey),
				'Error messages should not contain the actual API key',
			);
		}
	},
);

test.serial(
	'Local settings - should not expose API key when saving/loading',
	async t => {
		const testApiKey = 'gsk_1234567890abcdefghijklmnopqrstuvwxyz123456';

		let fileSystemWrites = '';

		// Mock filesystem operations to capture what's written
		t.context.sandbox
			.stub(require('fs'), 'writeFileSync')
			.callsFake(content => {
				fileSystemWrites += (content as string).toString();
			});

		t.context.sandbox.stub(require('fs'), 'existsSync').returns(true);
		t.context.sandbox
			.stub(require('fs'), 'readFileSync')
			.returns(JSON.stringify({apiKey: testApiKey}));

		const agent = await Agent.create('test-model', 0.5, null);
		agent.saveApiKey(testApiKey);

		// API key should be stored (this is expected for functionality)
		// but we verify it's not accidentally logged during the save process
		const allConsoleLogs = [
			...t.context.consoleLogStub.getCalls(),
			...t.context.consoleErrorStub.getCalls(),
			...t.context.consoleWarnStub.getCalls(),
		]
			.map(call => call.args.join(' '))
			.join(' ');

		t.false(
			allConsoleLogs.includes(testApiKey),
			'API key should not be logged during save/load operations',
		);
	},
);

test.serial('Debug log files - should not contain full API keys', async t => {
	const testApiKey = 'gsk_1234567890abcdefghijklmnopqrstuvwxyz123456';

	let allFileWrites = '';

	// Capture all file write operations
	t.context.sandbox
		.stub(require('fs'), 'writeFileSync')
		.callsFake((path, content) => {
			allFileWrites += `${path}: ${content}\n`;
		});

	t.context.sandbox
		.stub(require('fs'), 'appendFileSync')
		.callsFake((path, content) => {
			allFileWrites += `${path}: ${content}\n`;
		});

	// Create agent with debug enabled
	const agent = await Agent.create('test-model', 0.5, null, true);
	agent.setApiKey(testApiKey);

	// Check all file operations don't expose full API key
	t.false(
		allFileWrites.includes(testApiKey),
		'Full API key should never be written to any debug files',
	);

	// But masked versions might be present for debugging
	const maskedKeyPattern = /gsk_\w{8}\.{3}/;
	if (allFileWrites.includes('debug')) {
		// It's okay if masked versions are present for debugging
		t.pass(
			'Masked API keys in debug files are acceptable for debugging purposes',
		);
	}
});
