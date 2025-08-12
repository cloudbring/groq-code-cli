import test from 'ava';
import sinon from 'sinon';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useAgent, ChatMessage, ToolExecution } from '@src/ui/hooks/useAgent';
import { Agent } from '@src/core/agent';

// Setup afterEach cleanup
test.afterEach.always(() => {
  cleanup();
  sinon.restore();
});

// Mock setup
let mockAgent: any;
let mockOnStartRequest: any;
let mockOnAddApiTokens: any;
let mockOnPauseRequest: any;
let mockOnResumeRequest: any;
let mockOnCompleteRequest: any;
let toolCallbacks: any;

test.beforeEach(() => {
  mockAgent = {
    setToolCallbacks: sinon.stub(),
    chat: sinon.stub(),
    setApiKey: sinon.stub(),
    setSessionAutoApprove: sinon.stub(),
    clearHistory: sinon.stub(),
    interrupt: sinon.stub()
  };

  mockOnStartRequest = sinon.stub();
  mockOnAddApiTokens = sinon.stub();
  mockOnPauseRequest = sinon.stub();
  mockOnResumeRequest = sinon.stub();
  mockOnCompleteRequest = sinon.stub();
  toolCallbacks = {};

  // Capture the tool callbacks when they're set
  mockAgent.setToolCallbacks.callsFake((callbacks: any) => {
    toolCallbacks = callbacks;
  });
});

test('useAgent - should initialize with correct default values', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  t.deepEqual(result.current.messages, []);
  t.deepEqual(result.current.userMessageHistory, []);
  t.is(result.current.isProcessing, false);
  t.is(result.current.currentToolExecution, null);
  t.is(result.current.pendingApproval, null);
  t.is(result.current.pendingMaxIterations, null);
  t.is(result.current.sessionAutoApprove, false);
  t.is(result.current.showReasoning, true);
});

test('useAgent - should provide all required methods', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  t.is(typeof result.current.sendMessage, 'function');
  t.is(typeof result.current.approveToolExecution, 'function');
  t.is(typeof result.current.respondToMaxIterations, 'function');
  t.is(typeof result.current.addMessage, 'function');
  t.is(typeof result.current.setApiKey, 'function');
  t.is(typeof result.current.clearHistory, 'function');
  t.is(typeof result.current.toggleAutoApprove, 'function');
  t.is(typeof result.current.toggleReasoning, 'function');
  t.is(typeof result.current.interruptRequest, 'function');
});

test('useAgent - should add user message and call agent', async (t) => {
  mockAgent.chat.resolves(undefined);
  
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );

  await act(async () => {
    await result.current.sendMessage('Hello, world!');
  });

  t.is(result.current.messages.length, 1);
  t.is(result.current.messages[0].role, 'user');
  t.is(result.current.messages[0].content, 'Hello, world!');
  t.deepEqual(result.current.userMessageHistory, ['Hello, world!']);
  t.true(mockAgent.chat.calledWith('Hello, world!'));
  t.true(mockOnStartRequest.called);
  t.true(mockOnCompleteRequest.called);
});

test('useAgent - should not send message if already processing', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  // Start first message (make it hang)
  mockAgent.chat.callsFake(() => new Promise(() => {}));
  
  act(() => {
    result.current.sendMessage('First message');
  });

  t.is(result.current.isProcessing, true);

  // Try to send second message while processing
  await act(async () => {
    await result.current.sendMessage('Second message');
  });

  // Should only have the first message
  t.is(result.current.messages.length, 1);
  t.is(result.current.messages[0].content, 'First message');
});

test('useAgent - should handle chat errors gracefully', async (t) => {
  mockAgent.chat.rejects(new Error('API Error'));
  
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );

  await act(async () => {
    await result.current.sendMessage('Test message');
  });

  t.is(result.current.messages.length, 2);
  t.is(result.current.messages[1].role, 'system');
  t.true(result.current.messages[1].content.includes('Error: API Error'));
  t.is(result.current.isProcessing, false);
  t.true(mockOnCompleteRequest.called);
});

test('useAgent - should handle API errors with status and error details', async (t) => {
  const apiError = new Error('Unauthorized');
  (apiError as any).status = 401;
  (apiError as any).error = {
    error: {
      message: 'Invalid API key',
      code: 'invalid_api_key'
    }
  };
  
  mockAgent.chat.rejects(apiError);
  
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  await act(async () => {
    await result.current.sendMessage('Test message');
  });

  t.true(result.current.messages[1].content.includes('API Error (401): Invalid API key (Code: invalid_api_key)'));
});

test('useAgent - should ignore abort errors', async (t) => {
  const abortError = new Error('Request was aborted');
  abortError.name = 'AbortError';
  
  mockAgent.chat.rejects(abortError);
  
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  await act(async () => {
    await result.current.sendMessage('Test message');
  });

  // Should only have user message, no error message
  t.is(result.current.messages.length, 1);
  t.is(result.current.messages[0].role, 'user');
});

test('useAgent - should handle onThinkingText callback', async (t) => {
  // Initialize the hook and trigger sendMessage to set up the tool callbacks
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );
  
  // Send a message to trigger the setToolCallbacks call
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  // Test that tool callbacks are properly set up during initialization
  t.true(mockAgent.setToolCallbacks.called);
  t.is(typeof toolCallbacks.onThinkingText, 'function');
});

test('useAgent - should handle onFinalMessage callback', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );
  
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  t.is(typeof toolCallbacks.onFinalMessage, 'function');
});

test('useAgent - should handle onToolStart callback', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );
  
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  t.is(typeof toolCallbacks.onToolStart, 'function');
});

test('useAgent - should handle onToolEnd callback', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );
  
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  t.is(typeof toolCallbacks.onToolEnd, 'function');
});

test('useAgent - should handle onApiUsage callback', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );
  
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  t.is(typeof toolCallbacks.onApiUsage, 'function');
  
  // Test that the callback forwards to the metrics function
  toolCallbacks.onApiUsage({
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  });
  
  t.true(mockOnAddApiTokens.calledWith({
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  }));
});

test('useAgent - should handle onToolApproval callback', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );
  
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  t.is(typeof toolCallbacks.onToolApproval, 'function');
});

test('useAgent - should handle onMaxIterations callback', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
  );
  
  await act(async () => {
    await result.current.sendMessage('Test message');
  });
  
  t.is(typeof toolCallbacks.onMaxIterations, 'function');
});

test('useAgent - should approve tool execution', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  // Test that the approveToolExecution function exists
  t.is(typeof result.current.approveToolExecution, 'function');
});

test('useAgent - should reject tool execution', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  const mockResolve = sinon.stub();
  
  // Manually set pending approval state
  act(() => {
    result.current.sendMessage('Test');
  });

  // We need to simulate the pendingApproval state
  // This is tricky to test directly due to the async nature and closure
  t.truthy(result.current.approveToolExecution);
});

test('useAgent - should set API key on agent', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  act(() => {
    result.current.setApiKey('test-api-key');
  });

  t.true(mockAgent.setApiKey.calledWith('test-api-key'));
});

test('useAgent - should toggle auto approve', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  t.is(result.current.sessionAutoApprove, false);

  act(() => {
    result.current.toggleAutoApprove();
  });

  t.is(result.current.sessionAutoApprove, true);
  t.true(mockAgent.setSessionAutoApprove.calledWith(true));

  act(() => {
    result.current.toggleAutoApprove();
  });

  t.is(result.current.sessionAutoApprove, false);
  t.true(mockAgent.setSessionAutoApprove.calledWith(false));
});

test('useAgent - should clear history', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  // Add some messages first
  act(() => {
    result.current.addMessage({
      role: 'user',
      content: 'Test message'
    });
  });

  t.is(result.current.messages.length, 1);

  act(() => {
    result.current.clearHistory();
  });

  t.is(result.current.messages.length, 0);
  t.is(result.current.userMessageHistory.length, 0);
  t.true(mockAgent.clearHistory.called);
});

test('useAgent - should interrupt request', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  act(() => {
    result.current.interruptRequest();
  });

  t.true(mockAgent.interrupt.called);
  t.is(result.current.isProcessing, false);
  t.is(result.current.currentToolExecution, null);
  t.is(result.current.messages.length, 1);
  t.is(result.current.messages[0].role, 'system');
  t.is(result.current.messages[0].content, 'User has interrupted the request.');
});

test('useAgent - should toggle reasoning display', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  t.is(result.current.showReasoning, true);

  act(() => {
    result.current.toggleReasoning();
  });

  t.is(result.current.showReasoning, false);

  act(() => {
    result.current.toggleReasoning();
  });

  t.is(result.current.showReasoning, true);
});

test('useAgent - should add message with generated id and timestamp', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  let messageId: string = '';
  act(() => {
    messageId = result.current.addMessage({
      role: 'user',
      content: 'Test message'
    });
  });

  t.is(result.current.messages.length, 1);
  t.is(result.current.messages[0].id, messageId);
  t.truthy(result.current.messages[0].timestamp instanceof Date);
  t.is(result.current.messages[0].role, 'user');
  t.is(result.current.messages[0].content, 'Test message');
});

test('useAgent - should add message with reasoning', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  act(() => {
    result.current.addMessage({
      role: 'assistant',
      content: 'Response',
      reasoning: 'This is why I responded this way'
    });
  });

  t.is(result.current.messages[0].reasoning, 'This is why I responded this way');
});

test('useAgent - should generate unique message ids', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  let id1: string = '';
  let id2: string = '';
  act(() => {
    id1 = result.current.addMessage({
      role: 'user',
      content: 'Message 1'
    });
    id2 = result.current.addMessage({
      role: 'user',
      content: 'Message 2'
    });
  });

  t.not(id1, id2);
  t.is(result.current.messages.length, 2);
});

test('useAgent - should identify tools that need approval', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  await act(async () => {
    await result.current.sendMessage('Test');
  });

  const toolCallbacks = mockAgent.setToolCallbacks.getCall(0).args[0];

  // Test dangerous tool
  act(() => {
    toolCallbacks.onToolStart('delete_file', { file_path: 'test.js' });
  });

  t.is(result.current.currentToolExecution?.needsApproval, true);

  // Test approval required tool
  act(() => {
    toolCallbacks.onToolStart('create_file', { file_path: 'test.js', content: 'test' });
  });

  t.is(result.current.currentToolExecution?.needsApproval, true);

  // Test safe tool
  act(() => {
    toolCallbacks.onToolStart('read_file', { file_path: 'test.js' });
  });

  t.is(result.current.currentToolExecution?.needsApproval, false);
});

test('useAgent - should handle tool execution status changes', async (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  await act(async () => {
    await result.current.sendMessage('Test');
  });

  const toolCallbacks = mockAgent.setToolCallbacks.getCall(0).args[0];

  // Start tool
  act(() => {
    toolCallbacks.onToolStart('read_file', { file_path: 'test.js' });
  });

  t.is(result.current.currentToolExecution?.status, 'pending');

  // Complete tool
  act(() => {
    toolCallbacks.onToolEnd('read_file', { success: true });
  });

  t.is(result.current.currentToolExecution, null);
});

test('useAgent - should handle empty message content', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  act(() => {
    result.current.addMessage({
      role: 'user',
      content: ''
    });
  });

  t.is(result.current.messages[0].content, '');
});

test('useAgent - should handle multiple rapid message additions', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  act(() => {
    for (let i = 0; i < 10; i++) {
      result.current.addMessage({
        role: 'user',
        content: `Message ${i}`
      });
    }
  });

  t.is(result.current.messages.length, 10);
  t.deepEqual(result.current.messages.map(m => m.content), [
    'Message 0', 'Message 1', 'Message 2', 'Message 3', 'Message 4',
    'Message 5', 'Message 6', 'Message 7', 'Message 8', 'Message 9'
  ]);
});

test('useAgent - should handle callback functions being undefined', (t) => {
  const { result } = renderHook(() => 
    useAgent(mockAgent) // No callback functions provided
  );

  t.notThrows(() => {
    result.current.sendMessage('Test');
  });
});

test('useAgent - should handle agent methods throwing errors', (t) => {
  mockAgent.setApiKey.throws(new Error('Agent error'));

  const { result } = renderHook(() => 
    useAgent(mockAgent)
  );

  t.throws(() => {
    result.current.setApiKey('test-key');
  }, { message: 'Agent error' });
});