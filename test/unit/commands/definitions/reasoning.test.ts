import anyTest, {type TestFn} from 'ava';
import sinon from 'sinon';
import type {CommandContext} from '../../../../src/commands/base';
import {reasoningCommand} from '../../../../src/commands/definitions/reasoning';

const test = anyTest as TestFn<{mockCommandContext: CommandContext}>;

test('reasoningCommand - should have correct command properties', t => {
	t.is(reasoningCommand.command, 'reasoning');
	t.is(
		reasoningCommand.description,
		'Toggle display of reasoning content in messages',
	);
	t.is(typeof reasoningCommand.handler, 'function');
});

test.afterEach.always(() => {
	sinon.restore();
});

test('reasoningCommand - should toggle reasoning and add enabled message when showReasoning is false', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: sinon.stub(),
		// ARRANGE: Reasoning starts off as false
		showReasoning: false,
	};

	reasoningCommand.handler(mockContext);

	// ACT: Flips Reasoning to true
	t.is(mockContext.toggleReasoning?.callCount, 1);
	t.is(mockContext.addMessage.callCount, 1);
	t.true(
		mockContext.addMessage.calledWith({
			role: 'system',
			// ASSERT: Message reflects true state of Reasoning
			content: 'Reasoning display is now enabled.',
		}),
	);

	sinon.restore();
});

test('reasoningCommand - should toggle reasoning and add disabled message when showReasoning is true', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: sinon.stub(),
		// ARRANGE: Reasoning starts off as true
		showReasoning: true,
	};

	reasoningCommand.handler(mockContext);

	// ACT: Flips Reasoning to false
	t.is(mockContext.toggleReasoning?.callCount, 1);
	t.is(mockContext.addMessage.callCount, 1);
	t.true(
		mockContext.addMessage.calledWith({
			// ASSERT: Message reflects false state of Reasoning
			role: 'system',
			content: 'Reasoning display is now disabled.',
		}),
	);

	sinon.restore();
});

test('reasoningCommand - should show not available message when toggleReasoning is undefined', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		// toggleReasoning is undefined
		// showReasoning is undefined
	};

	reasoningCommand.handler(mockContext);

	t.is(mockContext.addMessage.callCount, 1);
	t.true(
		mockContext.addMessage.calledWith({
			role: 'system',
			content: 'Reasoning toggle functionality is not available.',
		}),
	);
});

test('reasoningCommand - should show not available message when toggleReasoning is null', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: undefined,
		showReasoning: undefined,
	};

	reasoningCommand.handler(mockContext);

	t.true(
		mockContext.addMessage.calledWith({
			role: 'system',
			content: 'Reasoning toggle functionality is not available.',
		}),
	);
});

test('reasoningCommand - should handle showReasoning being undefined when toggleReasoning exists', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: sinon.stub(),
		// showReasoning is undefined
	};

	reasoningCommand.handler(mockContext);

	t.true(mockContext.toggleReasoning?.called);
	t.true(
		mockContext.addMessage.calledWith({
			role: 'system',
			content: 'Reasoning display is now enabled.', // !undefined = true
		}),
	);
});

test('reasoningCommand - should not call other context methods when toggleReasoning is available', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: sinon.stub(),
		showReasoning: false,
		setShowModelSelector: sinon.stub(),
	};

	reasoningCommand.handler(mockContext);

	t.false(mockContext.clearHistory.called);
	t.false(mockContext.setShowLogin.called);
	t.false(mockContext.setShowModelSelector.called);
});

test('reasoningCommand - should not call other context methods when toggleReasoning is unavailable', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		setShowModelSelector: sinon.stub(),
		// toggleReasoning is undefined
	};

	reasoningCommand.handler(mockContext);

	t.false(mockContext.clearHistory.called);
	t.false(mockContext.setShowLogin.called);
	t.false(mockContext.setShowModelSelector.called);
});

test('reasoningCommand - should handle context destructuring correctly', t => {
	const mockAddMessage = sinon.stub();
	const mockToggleReasoning = sinon.stub();

	const mockContext: CommandContext = {
		addMessage: mockAddMessage,
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: mockToggleReasoning,
		showReasoning: true,
	};

	reasoningCommand.handler(mockContext);

	t.is(mockToggleReasoning.callCount, 1);
	t.true(
		mockAddMessage.calledWith({
			role: 'system',
			content: 'Reasoning display is now disabled.',
		}),
	);
});

test('reasoningCommand - should work with minimal context when toggleReasoning is unavailable', t => {
	const mockContext: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
	};

	t.notThrows(() => reasoningCommand.handler(mockContext));
	t.true(
		mockContext.addMessage.calledWith({
			role: 'system',
			content: 'Reasoning toggle functionality is not available.',
		}),
	);
});

test('reasoningCommand - should correctly invert showReasoning state in message', t => {
	// Test false -> enabled
	const mockContextFalse: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: sinon.stub(),
		showReasoning: false,
	};

	reasoningCommand.handler(mockContextFalse);
	t.true(
		mockContextFalse.addMessage.calledWith({
			role: 'system',
			content: 'Reasoning display is now enabled.',
		}),
	);

	// Test true -> disabled
	const mockContextTrue: CommandContext = {
		addMessage: sinon.stub(),
		clearHistory: sinon.stub(),
		setShowLogin: sinon.stub(),
		toggleReasoning: sinon.stub(),
		showReasoning: true,
	};

	reasoningCommand.handler(mockContextTrue);
	t.true(
		mockContextTrue.addMessage.calledWith({
			role: 'system',
			content: 'Reasoning display is now disabled.',
		}),
	);
});
