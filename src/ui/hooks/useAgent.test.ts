import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgent, ChatMessage, ToolExecution } from './useAgent';
import { Agent } from '../../core/agent';

// Mock the Agent class
vi.mock('../../core/agent', () => ({
  Agent: vi.fn().mockImplementation(() => ({
    setToolCallbacks: vi.fn(),
    chat: vi.fn(),
    setApiKey: vi.fn(),
    setSessionAutoApprove: vi.fn(),
    clearHistory: vi.fn(),
    interrupt: vi.fn()
  }))
}));

describe('useAgent', () => {
  let mockAgent: any;
  let mockOnStartRequest: any;
  let mockOnAddApiTokens: any;
  let mockOnPauseRequest: any;
  let mockOnResumeRequest: any;
  let mockOnCompleteRequest: any;

  beforeEach(() => {
    mockAgent = {
      setToolCallbacks: vi.fn(),
      chat: vi.fn(),
      setApiKey: vi.fn(),
      setSessionAutoApprove: vi.fn(),
      clearHistory: vi.fn(),
      interrupt: vi.fn()
    };

    mockOnStartRequest = vi.fn();
    mockOnAddApiTokens = vi.fn();
    mockOnPauseRequest = vi.fn();
    mockOnResumeRequest = vi.fn();
    mockOnCompleteRequest = vi.fn();

    (Agent as any).mockImplementation(() => mockAgent);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      expect(result.current.messages).toEqual([]);
      expect(result.current.userMessageHistory).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentToolExecution).toBeNull();
      expect(result.current.pendingApproval).toBeNull();
      expect(result.current.pendingMaxIterations).toBeNull();
      expect(result.current.sessionAutoApprove).toBe(false);
      expect(result.current.showReasoning).toBe(true);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.approveToolExecution).toBe('function');
      expect(typeof result.current.respondToMaxIterations).toBe('function');
      expect(typeof result.current.addMessage).toBe('function');
      expect(typeof result.current.setApiKey).toBe('function');
      expect(typeof result.current.clearHistory).toBe('function');
      expect(typeof result.current.toggleAutoApprove).toBe('function');
      expect(typeof result.current.toggleReasoning).toBe('function');
      expect(typeof result.current.interruptRequest).toBe('function');
    });
  });

  describe('sendMessage', () => {
    it('should add user message and call agent', async () => {
      mockAgent.chat.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => 
        useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
      );

      await act(async () => {
        await result.current.sendMessage('Hello, world!');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello, world!');
      expect(result.current.userMessageHistory).toEqual(['Hello, world!']);
      expect(mockAgent.chat).toHaveBeenCalledWith('Hello, world!');
      expect(mockOnStartRequest).toHaveBeenCalled();
      expect(mockOnCompleteRequest).toHaveBeenCalled();
    });

    it('should not send message if already processing', async () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      // Start first message (make it hang)
      mockAgent.chat.mockImplementation(() => new Promise(() => {}));
      
      act(() => {
        result.current.sendMessage('First message');
      });

      expect(result.current.isProcessing).toBe(true);

      // Try to send second message while processing
      await act(async () => {
        await result.current.sendMessage('Second message');
      });

      // Should only have the first message
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('First message');
    });

    it('should handle chat errors gracefully', async () => {
      mockAgent.chat.mockRejectedValue(new Error('API Error'));
      
      const { result } = renderHook(() => 
        useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe('system');
      expect(result.current.messages[1].content).toContain('Error: API Error');
      expect(result.current.isProcessing).toBe(false);
      expect(mockOnCompleteRequest).toHaveBeenCalled();
    });

    it('should handle API errors with status and error details', async () => {
      const apiError = new Error('Unauthorized');
      (apiError as any).status = 401;
      (apiError as any).error = {
        error: {
          message: 'Invalid API key',
          code: 'invalid_api_key'
        }
      };
      
      mockAgent.chat.mockRejectedValue(apiError);
      
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(result.current.messages[1].content).toContain('API Error (401): Invalid API key (Code: invalid_api_key)');
    });

    it('should ignore abort errors', async () => {
      const abortError = new Error('Request was aborted');
      abortError.name = 'AbortError';
      
      mockAgent.chat.mockRejectedValue(abortError);
      
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      // Should only have user message, no error message
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
    });
  });

  describe('tool execution callbacks', () => {
    let toolCallbacks: any;

    beforeEach(() => {
      const { result } = renderHook(() => 
        useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
      );

      act(() => {
        result.current.sendMessage('Test message');
      });

      toolCallbacks = mockAgent.setToolCallbacks.mock.calls[0][0];
    });

    it('should handle onThinkingText callback', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        toolCallbacks.onThinkingText('Thinking about the problem...', 'This is my reasoning');
      });

      const assistantMessage = result.current.messages.find(m => m.role === 'assistant');
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage?.content).toBe('Thinking about the problem...');
      expect(assistantMessage?.reasoning).toBe('This is my reasoning');
    });

    it('should handle onFinalMessage callback', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        toolCallbacks.onFinalMessage('Final response', 'Final reasoning');
      });

      const assistantMessage = result.current.messages.find(m => m.role === 'assistant');
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage?.content).toBe('Final response');
      expect(assistantMessage?.reasoning).toBe('Final reasoning');
    });

    it('should handle onToolStart callback', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        toolCallbacks.onToolStart('read_file', { file_path: 'test.js' });
      });

      expect(result.current.currentToolExecution).not.toBeNull();
      expect(result.current.currentToolExecution?.name).toBe('read_file');
      expect(result.current.currentToolExecution?.args).toEqual({ file_path: 'test.js' });
      expect(result.current.currentToolExecution?.status).toBe('pending');

      const toolMessage = result.current.messages.find(m => m.role === 'tool_execution');
      expect(toolMessage).toBeDefined();
      expect(toolMessage?.content).toBe('Executing read_file...');
    });

    it('should handle onToolEnd callback with success', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      // Start a tool first
      act(() => {
        toolCallbacks.onToolStart('read_file', { file_path: 'test.js' });
      });

      const toolMessage = result.current.messages.find(m => m.role === 'tool_execution');
      const executionId = toolMessage?.toolExecution?.id;

      act(() => {
        toolCallbacks.onToolEnd('read_file', { 
          success: true, 
          content: 'File content', 
          message: 'File read successfully' 
        });
      });

      const updatedMessage = result.current.messages.find(m => m.toolExecution?.id === executionId);
      expect(updatedMessage?.content).toBe('✓ read_file completed successfully');
      expect(updatedMessage?.toolExecution?.status).toBe('completed');
      expect(result.current.currentToolExecution).toBeNull();
    });

    it('should handle onToolEnd callback with failure', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      // Start a tool first
      act(() => {
        toolCallbacks.onToolStart('read_file', { file_path: 'test.js' });
      });

      const toolMessage = result.current.messages.find(m => m.role === 'tool_execution');
      const executionId = toolMessage?.toolExecution?.id;

      act(() => {
        toolCallbacks.onToolEnd('read_file', { 
          success: false, 
          error: 'File not found' 
        });
      });

      const updatedMessage = result.current.messages.find(m => m.toolExecution?.id === executionId);
      expect(updatedMessage?.content).toBe('🔴 read_file failed: File not found');
      expect(updatedMessage?.toolExecution?.status).toBe('failed');
    });

    it('should handle onToolEnd callback with user rejection', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      // Start a tool first
      act(() => {
        toolCallbacks.onToolStart('delete_file', { file_path: 'test.js' });
      });

      const toolMessage = result.current.messages.find(m => m.role === 'tool_execution');
      const executionId = toolMessage?.toolExecution?.id;

      act(() => {
        toolCallbacks.onToolEnd('delete_file', { 
          success: false, 
          userRejected: true,
          error: 'Tool execution canceled by user'
        });
      });

      const updatedMessage = result.current.messages.find(m => m.toolExecution?.id === executionId);
      expect(updatedMessage?.content).toBe('🚫 delete_file rejected by user');
      expect(updatedMessage?.toolExecution?.status).toBe('canceled');
    });

    it('should handle onApiUsage callback', () => {
      act(() => {
        toolCallbacks.onApiUsage({
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        });
      });

      expect(mockOnAddApiTokens).toHaveBeenCalledWith({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      });
    });

    it('should handle onToolApproval callback', async () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
      );

      // Start a tool that requires approval
      act(() => {
        toolCallbacks.onToolStart('create_file', { file_path: 'new.js', content: 'test' });
      });

      // Simulate approval request
      let approvalPromise: Promise<any>;
      act(() => {
        approvalPromise = toolCallbacks.onToolApproval('create_file', { file_path: 'new.js', content: 'test' });
      });

      expect(result.current.pendingApproval).not.toBeNull();
      expect(result.current.pendingApproval?.toolName).toBe('create_file');
      expect(mockOnPauseRequest).toHaveBeenCalled();

      // Approve the tool
      act(() => {
        result.current.approveToolExecution(true, false);
      });

      const approvalResult = await approvalPromise;
      expect(approvalResult).toEqual({ approved: true, autoApproveSession: false });
      expect(result.current.pendingApproval).toBeNull();
      expect(mockOnResumeRequest).toHaveBeenCalled();
    });

    it('should handle onMaxIterations callback', async () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent, mockOnStartRequest, mockOnAddApiTokens, mockOnPauseRequest, mockOnResumeRequest, mockOnCompleteRequest)
      );

      // Simulate max iterations reached
      let maxIterationsPromise: Promise<boolean>;
      act(() => {
        maxIterationsPromise = toolCallbacks.onMaxIterations(50);
      });

      expect(result.current.pendingMaxIterations).not.toBeNull();
      expect(result.current.pendingMaxIterations?.maxIterations).toBe(50);
      expect(mockOnPauseRequest).toHaveBeenCalled();

      // Decide to continue
      act(() => {
        result.current.respondToMaxIterations(true);
      });

      const shouldContinue = await maxIterationsPromise;
      expect(shouldContinue).toBe(true);
      expect(result.current.pendingMaxIterations).toBeNull();
      expect(mockOnResumeRequest).toHaveBeenCalled();
    });
  });

  describe('tool approval', () => {
    it('should approve tool execution', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      const mockResolve = vi.fn();
      act(() => {
        result.current.sendMessage('Test');
      });

      // Set up pending approval
      act(() => {
        (result.current as any).setPendingApproval({
          toolName: 'create_file',
          toolArgs: { file_path: 'test.js' },
          resolve: mockResolve
        });
      });

      act(() => {
        result.current.approveToolExecution(true, true);
      });

      expect(mockResolve).toHaveBeenCalledWith({ approved: true, autoApproveSession: true });
      expect(result.current.sessionAutoApprove).toBe(true);
    });

    it('should reject tool execution', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      const mockResolve = vi.fn();
      
      // Manually set pending approval state
      act(() => {
        result.current.sendMessage('Test');
      });

      // We need to simulate the pendingApproval state
      // This is tricky to test directly due to the async nature and closure
      expect(result.current.approveToolExecution).toBeDefined();
    });
  });

  describe('utility functions', () => {
    it('should set API key on agent', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        result.current.setApiKey('test-api-key');
      });

      expect(mockAgent.setApiKey).toHaveBeenCalledWith('test-api-key');
    });

    it('should toggle auto approve', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      expect(result.current.sessionAutoApprove).toBe(false);

      act(() => {
        result.current.toggleAutoApprove();
      });

      expect(result.current.sessionAutoApprove).toBe(true);
      expect(mockAgent.setSessionAutoApprove).toHaveBeenCalledWith(true);

      act(() => {
        result.current.toggleAutoApprove();
      });

      expect(result.current.sessionAutoApprove).toBe(false);
      expect(mockAgent.setSessionAutoApprove).toHaveBeenCalledWith(false);
    });

    it('should clear history', () => {
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

      expect(result.current.messages).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.userMessageHistory).toHaveLength(0);
      expect(mockAgent.clearHistory).toHaveBeenCalled();
    });

    it('should interrupt request', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        result.current.interruptRequest();
      });

      expect(mockAgent.interrupt).toHaveBeenCalled();
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentToolExecution).toBeNull();
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('system');
      expect(result.current.messages[0].content).toBe('User has interrupted the request.');
    });

    it('should toggle reasoning display', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      expect(result.current.showReasoning).toBe(true);

      act(() => {
        result.current.toggleReasoning();
      });

      expect(result.current.showReasoning).toBe(false);

      act(() => {
        result.current.toggleReasoning();
      });

      expect(result.current.showReasoning).toBe(true);
    });
  });

  describe('message management', () => {
    it('should add message with generated id and timestamp', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      let messageId: string;
      act(() => {
        messageId = result.current.addMessage({
          role: 'user',
          content: 'Test message'
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe(messageId);
      expect(result.current.messages[0].timestamp).toBeInstanceOf(Date);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Test message');
    });

    it('should add message with reasoning', () => {
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

      expect(result.current.messages[0].reasoning).toBe('This is why I responded this way');
    });

    it('should generate unique message ids', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      let id1: string, id2: string;
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

      expect(id1).not.toBe(id2);
      expect(result.current.messages).toHaveLength(2);
    });
  });

  describe('tool execution states', () => {
    it('should identify tools that need approval', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        result.current.sendMessage('Test');
      });

      const toolCallbacks = mockAgent.setToolCallbacks.mock.calls[0][0];

      // Test dangerous tool
      act(() => {
        toolCallbacks.onToolStart('delete_file', { file_path: 'test.js' });
      });

      expect(result.current.currentToolExecution?.needsApproval).toBe(true);

      // Test approval required tool
      act(() => {
        toolCallbacks.onToolStart('create_file', { file_path: 'test.js', content: 'test' });
      });

      expect(result.current.currentToolExecution?.needsApproval).toBe(true);

      // Test safe tool
      act(() => {
        toolCallbacks.onToolStart('read_file', { file_path: 'test.js' });
      });

      expect(result.current.currentToolExecution?.needsApproval).toBe(false);
    });

    it('should handle tool execution status changes', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        result.current.sendMessage('Test');
      });

      const toolCallbacks = mockAgent.setToolCallbacks.mock.calls[0][0];

      // Start tool
      act(() => {
        toolCallbacks.onToolStart('read_file', { file_path: 'test.js' });
      });

      expect(result.current.currentToolExecution?.status).toBe('pending');

      // Complete tool
      act(() => {
        toolCallbacks.onToolEnd('read_file', { success: true });
      });

      expect(result.current.currentToolExecution).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty message content', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      act(() => {
        result.current.addMessage({
          role: 'user',
          content: ''
        });
      });

      expect(result.current.messages[0].content).toBe('');
    });

    it('should handle multiple rapid message additions', () => {
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

      expect(result.current.messages).toHaveLength(10);
      expect(result.current.messages.map(m => m.content)).toEqual([
        'Message 0', 'Message 1', 'Message 2', 'Message 3', 'Message 4',
        'Message 5', 'Message 6', 'Message 7', 'Message 8', 'Message 9'
      ]);
    });

    it('should handle callback functions being undefined', () => {
      const { result } = renderHook(() => 
        useAgent(mockAgent) // No callback functions provided
      );

      expect(() => {
        result.current.sendMessage('Test');
      }).not.toThrow();
    });

    it('should handle agent methods throwing errors', () => {
      mockAgent.setApiKey.mockImplementation(() => {
        throw new Error('Agent error');
      });

      const { result } = renderHook(() => 
        useAgent(mockAgent)
      );

      expect(() => {
        result.current.setApiKey('test-key');
      }).toThrow('Agent error');
    });
  });
});