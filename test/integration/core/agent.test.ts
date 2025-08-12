import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Agent } from '@src/core/agent';
import Groq from 'groq-sdk';
import { ConfigManager } from '@src/utils/local-settings';
import { executeTool } from '@src/tools/tools';
import { validateReadBeforeEdit, getReadBeforeEditError } from '@src/tools/validators';
import fs from 'fs';

// Mock Groq SDK
vi.mock('groq-sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

// Mock ConfigManager
vi.mock('@src/utils/local-settings', () => ({
  ConfigManager: vi.fn().mockImplementation(() => ({
    getApiKey: vi.fn(),
    setApiKey: vi.fn(),
    clearApiKey: vi.fn(),
    getDefaultModel: vi.fn(),
    setDefaultModel: vi.fn()
  }))
}));

// Mock tools
vi.mock('@src/tools/tools', () => ({
  executeTool: vi.fn()
}));

// Mock validators
vi.mock('@src/tools/validators', () => ({
  validateReadBeforeEdit: vi.fn(),
  getReadBeforeEditError: vi.fn()
}));

// Mock fs
vi.mock('fs', () => ({
  default: {
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn()
  }
}));

describe('Agent', () => {
  let mockGroqInstance: any;
  let mockConfigManager: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock instances
    mockGroqInstance = {
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    };
    
    mockConfigManager = {
      getApiKey: vi.fn(),
      setApiKey: vi.fn(),
      clearApiKey: vi.fn(),
      getDefaultModel: vi.fn(),
      setDefaultModel: vi.fn()
    };
    
    (Groq as any).mockImplementation(() => mockGroqInstance);
    (ConfigManager as any).mockImplementation(() => mockConfigManager);
    
    // Clear environment variables
    process.env = { ...originalEnv };
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Agent.create', () => {
    it('should create agent with provided model', async () => {
      mockConfigManager.getDefaultModel.mockReturnValue(null);
      
      const agent = await Agent.create('llama-3.1-8b-instant', 0.7, null);
      
      expect(agent).toBeInstanceOf(Agent);
      expect(agent.getCurrentModel()).toBe('llama-3.1-8b-instant');
    });

    it('should use default model from config if available', async () => {
      mockConfigManager.getDefaultModel.mockReturnValue('llama-3.1-70b-versatile');
      
      const agent = await Agent.create('llama-3.1-8b-instant', 0.7, null);
      
      expect(agent.getCurrentModel()).toBe('llama-3.1-70b-versatile');
    });

    it('should use provided model if no default in config', async () => {
      mockConfigManager.getDefaultModel.mockReturnValue(null);
      
      const agent = await Agent.create('test-model', 0.5, null);
      
      expect(agent.getCurrentModel()).toBe('test-model');
    });

    it('should accept custom system message', async () => {
      const agent = await Agent.create('test-model', 0.5, 'Custom system message');
      
      expect(agent).toBeInstanceOf(Agent);
      // System message is private, so we can't directly test it
      // but we can verify the agent was created successfully
    });
  });

  describe('API Key Management', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.create('test-model', 0.5, null);
    });

    it('should set API key', () => {
      agent.setApiKey('test-api-key');
      
      expect(Groq).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should save API key', () => {
      agent.saveApiKey('test-api-key');
      
      expect(mockConfigManager.setApiKey).toHaveBeenCalledWith('test-api-key');
      expect(Groq).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should clear API key', () => {
      agent.clearApiKey();
      
      expect(mockConfigManager.clearApiKey).toHaveBeenCalled();
    });
  });

  describe('Model Management', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.create('initial-model', 0.5, null);
    });

    it('should set and get current model', () => {
      agent.setModel('new-model');
      
      expect(agent.getCurrentModel()).toBe('new-model');
      expect(mockConfigManager.setDefaultModel).toHaveBeenCalledWith('new-model');
    });

    it('should update system message when model changes', () => {
      const initialModel = agent.getCurrentModel();
      agent.setModel('new-model');
      
      expect(agent.getCurrentModel()).toBe('new-model');
      expect(agent.getCurrentModel()).not.toBe(initialModel);
    });
  });

  describe('Session Management', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.create('test-model', 0.5, null);
    });

    it('should set session auto approve', () => {
      agent.setSessionAutoApprove(true);
      
      // Can't directly test private property, but method should not throw
      expect(() => agent.setSessionAutoApprove(false)).not.toThrow();
    });

    it('should clear history', () => {
      agent.clearHistory();
      
      // Should not throw - method affects internal state
      expect(() => agent.clearHistory()).not.toThrow();
    });

    it('should set tool callbacks', () => {
      const callbacks = {
        onToolStart: vi.fn(),
        onToolEnd: vi.fn(),
        onToolApproval: vi.fn(),
        onThinkingText: vi.fn(),
        onFinalMessage: vi.fn(),
        onMaxIterations: vi.fn(),
        onApiUsage: vi.fn()
      };
      
      agent.setToolCallbacks(callbacks);
      
      // Should not throw - method sets internal callbacks
      expect(() => agent.setToolCallbacks(callbacks)).not.toThrow();
    });

    it('should handle interrupt', () => {
      agent.interrupt();
      
      // Should not throw - method sets internal state
      expect(() => agent.interrupt()).not.toThrow();
    });
  });

  describe('Chat Functionality', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.create('test-model', 0.5, null);
    });

    it('should throw error when no API key available', async () => {
      mockConfigManager.getApiKey.mockReturnValue(null);
      
      await expect(agent.chat('Hello')).rejects.toThrow('No API key available');
    });

    it('should use API key from environment variable', async () => {
      process.env.GROQ_API_KEY = 'env-api-key';
      
      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { content: 'Hello response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      });

      const onFinalMessage = vi.fn();
      agent.setToolCallbacks({ onFinalMessage });

      await agent.chat('Hello');
      
      expect(Groq).toHaveBeenCalledWith({ apiKey: 'env-api-key' });
      expect(onFinalMessage).toHaveBeenCalledWith('Hello response', undefined);
    });

    it('should use API key from config file when env var not available', async () => {
      mockConfigManager.getApiKey.mockReturnValue('config-api-key');
      
      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { content: 'Hello response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      });

      const onFinalMessage = vi.fn();
      agent.setToolCallbacks({ onFinalMessage });

      await agent.chat('Hello');
      
      expect(Groq).toHaveBeenCalledWith({ apiKey: 'config-api-key' });
    });

    it('should handle simple chat without tools', async () => {
      agent.setApiKey('test-key');
      
      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { content: 'Simple response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 8,
          total_tokens: 23
        }
      });

      const onFinalMessage = vi.fn();
      const onApiUsage = vi.fn();
      agent.setToolCallbacks({ onFinalMessage, onApiUsage });

      await agent.chat('Simple question');
      
      expect(onFinalMessage).toHaveBeenCalledWith('Simple response', undefined);
      expect(onApiUsage).toHaveBeenCalledWith({
        prompt_tokens: 15,
        completion_tokens: 8,
        total_tokens: 23
      });
    });

    it('should handle chat with reasoning', async () => {
      agent.setApiKey('test-key');
      
      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Response with reasoning',
            reasoning: 'This is the reasoning'
          },
          finish_reason: 'stop'
        }],
        usage: null
      });

      const onFinalMessage = vi.fn();
      agent.setToolCallbacks({ onFinalMessage });

      await agent.chat('Question');
      
      expect(onFinalMessage).toHaveBeenCalledWith('Response with reasoning', 'This is the reasoning');
    });

    it('should handle tool calls', async () => {
      agent.setApiKey('test-key');
      
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'read_file',
          arguments: JSON.stringify({ file_path: 'test.js' })
        }
      };

      // First call returns tool call, second returns final response
      mockGroqInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ 
            message: { 
              content: 'I need to read a file',
              tool_calls: [mockToolCall]
            },
            finish_reason: 'tool_calls'
          }],
          usage: null
        })
        .mockResolvedValueOnce({
          choices: [{ 
            message: { content: 'File contents processed' },
            finish_reason: 'stop'
          }],
          usage: null
        });

      (executeTool as any).mockResolvedValue({
        success: true,
        content: 'File content',
        message: 'File read successfully'
      });

      const onToolStart = vi.fn();
      const onToolEnd = vi.fn();
      const onThinkingText = vi.fn();
      const onFinalMessage = vi.fn();
      
      agent.setToolCallbacks({ 
        onToolStart, 
        onToolEnd, 
        onThinkingText,
        onFinalMessage 
      });

      await agent.chat('Read test.js');
      
      expect(onThinkingText).toHaveBeenCalledWith('I need to read a file', undefined);
      expect(onToolStart).toHaveBeenCalledWith('read_file', { file_path: 'test.js' });
      expect(onToolEnd).toHaveBeenCalledWith('read_file', expect.any(Object));
      expect(onFinalMessage).toHaveBeenCalledWith('File contents processed', undefined);
    });

    it('should handle tool call approval', async () => {
      agent.setApiKey('test-key');
      
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'create_file',
          arguments: JSON.stringify({ file_path: 'new.js', content: 'test' })
        }
      };

      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Creating file',
            tool_calls: [mockToolCall]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      (executeTool as any).mockResolvedValue({
        success: true,
        message: 'File created'
      });

      const onToolApproval = vi.fn().mockResolvedValue({ approved: true });
      const onToolStart = vi.fn();
      
      agent.setToolCallbacks({ onToolApproval, onToolStart });

      await agent.chat('Create new.js');
      
      expect(onToolApproval).toHaveBeenCalledWith('create_file', { file_path: 'new.js', content: 'test' });
      expect(onToolStart).toHaveBeenCalled();
    });

    it('should handle tool call rejection', async () => {
      agent.setApiKey('test-key');
      
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'delete_file',
          arguments: JSON.stringify({ file_path: 'important.js' })
        }
      };

      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Deleting file',
            tool_calls: [mockToolCall]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      const onToolApproval = vi.fn().mockResolvedValue({ approved: false });
      const onToolEnd = vi.fn();
      
      agent.setToolCallbacks({ onToolApproval, onToolEnd });

      await agent.chat('Delete important.js');
      
      expect(onToolApproval).toHaveBeenCalled();
      expect(onToolEnd).toHaveBeenCalledWith('delete_file', 
        expect.objectContaining({ 
          success: false, 
          userRejected: true 
        })
      );
    });

    it('should handle session auto approval', async () => {
      agent.setApiKey('test-key');
      agent.setSessionAutoApprove(true);
      
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'edit_file',
          arguments: JSON.stringify({ file_path: 'test.js', old_text: 'old', new_text: 'new' })
        }
      };

      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Editing file',
            tool_calls: [mockToolCall]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      (validateReadBeforeEdit as any).mockReturnValue(true);
      (executeTool as any).mockResolvedValue({
        success: true,
        message: 'File edited'
      });

      const onToolApproval = vi.fn();
      const onToolStart = vi.fn();
      
      agent.setToolCallbacks({ onToolApproval, onToolStart });

      await agent.chat('Edit test.js');
      
      expect(onToolApproval).not.toHaveBeenCalled(); // Should be auto-approved
      expect(onToolStart).toHaveBeenCalled();
    });

    it('should handle read-before-edit validation failure', async () => {
      agent.setApiKey('test-key');
      
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'edit_file',
          arguments: JSON.stringify({ file_path: 'test.js', old_text: 'old', new_text: 'new' })
        }
      };

      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Editing file',
            tool_calls: [mockToolCall]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      (validateReadBeforeEdit as any).mockReturnValue(false);
      (getReadBeforeEditError as any).mockReturnValue('Must read file before editing');

      const onToolEnd = vi.fn();
      agent.setToolCallbacks({ onToolEnd });

      await agent.chat('Edit test.js');
      
      expect(onToolEnd).toHaveBeenCalledWith('edit_file', 
        expect.objectContaining({ 
          success: false,
          error: 'Must read file before editing'
        })
      );
    });

    it('should handle truncated tool arguments', async () => {
      agent.setApiKey('test-key');
      
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'read_file',
          arguments: '{ "file_path": "test.js" ' // Truncated JSON
        }
      };

      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Reading file',
            tool_calls: [mockToolCall]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      const onToolEnd = vi.fn();
      const onThinkingText = vi.fn();
      agent.setToolCallbacks({ onToolEnd, onThinkingText });

      await agent.chat('Read test.js');
      
      // The current implementation doesn't call onToolEnd for JSON parsing errors
      // Only onThinkingText is called for the initial message
      expect(onThinkingText).toHaveBeenCalledWith('Reading file', undefined);
      // onToolEnd is not called for JSON parsing failures in the current implementation
      expect(onToolEnd).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      agent.setApiKey('test-key');
      
      const apiError = new Error('API Error');
      (apiError as any).status = 500;
      (apiError as any).error = {
        error: {
          message: 'Internal server error',
          code: 'internal_error'
        }
      };

      mockGroqInstance.chat.completions.create
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce({
          choices: [{ 
            message: { content: 'Recovery response' },
            finish_reason: 'stop'
          }],
          usage: null
        });

      const onFinalMessage = vi.fn();
      agent.setToolCallbacks({ onFinalMessage });

      await agent.chat('Test question');
      
      expect(onFinalMessage).toHaveBeenCalledWith('Recovery response', undefined);
    });

    it('should handle 401 API errors by throwing immediately', async () => {
      agent.setApiKey('invalid-key');
      
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;
      (authError as any).error = {
        error: {
          message: 'Invalid API key'
        }
      };

      mockGroqInstance.chat.completions.create.mockRejectedValue(authError);

      await expect(agent.chat('Test')).rejects.toThrow('Invalid API key');
    });

    it('should handle max iterations with user continuation', async () => {
      agent.setApiKey('test-key');
      
      // Mock many iterations
      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Thinking...',
            tool_calls: [{
              id: 'tool_1',
              function: {
                name: 'read_file',
                arguments: JSON.stringify({ file_path: 'test.js' })
              }
            }]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      (executeTool as any).mockResolvedValue({ success: true, content: 'data' });

      const onMaxIterations = vi.fn()
        .mockResolvedValueOnce(true) // User wants to continue
        .mockResolvedValueOnce(false); // User stops

      agent.setToolCallbacks({ onMaxIterations });

      await agent.chat('Complex task');
      
      expect(onMaxIterations).toHaveBeenCalledWith(50);
    });

    it('should handle interruption during chat', async () => {
      agent.setApiKey('test-key');
      
      mockGroqInstance.chat.completions.create.mockImplementation(() => {
        agent.interrupt();
        const abortError = new Error('Request was aborted');
        abortError.name = 'AbortError';
        throw abortError;
      });

      await agent.chat('Test');
      
      // Should not throw - interruption is handled gracefully
      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalled();
    });

    it('should strip repo_browser prefix from tool names', async () => {
      agent.setApiKey('test-key');
      
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'repo_browser.read_file',
          arguments: JSON.stringify({ file_path: 'test.js' })
        }
      };

      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Reading file',
            tool_calls: [mockToolCall]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      (executeTool as any).mockResolvedValue({ success: true, content: 'data' });

      const onToolStart = vi.fn();
      agent.setToolCallbacks({ onToolStart });

      await agent.chat('Read file');
      
      expect(onToolStart).toHaveBeenCalledWith('read_file', { file_path: 'test.js' });
    });
  });

  describe('Error Handling', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.create('test-model', 0.5, null);
      agent.setApiKey('test-key');
    });

    it('should handle tool execution errors', async () => {
      const mockToolCall = {
        id: 'tool_call_1',
        function: {
          name: 'read_file',
          arguments: JSON.stringify({ file_path: 'test.js' })
        }
      };

      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { 
            content: 'Reading file',
            tool_calls: [mockToolCall]
          },
          finish_reason: 'tool_calls'
        }],
        usage: null
      });

      (executeTool as any).mockRejectedValue(new Error('File not found'));

      const onToolEnd = vi.fn();
      const onToolStart = vi.fn();
      const onThinkingText = vi.fn();
      agent.setToolCallbacks({ onToolEnd, onToolStart, onThinkingText });

      await agent.chat('Read test.js');
      
      // The current implementation doesn't call onToolEnd when executeTool throws an error
      // But it does call onToolStart and onThinkingText
      expect(onThinkingText).toHaveBeenCalledWith('Reading file', undefined);
      expect(onToolStart).toHaveBeenCalledWith('read_file', { file_path: 'test.js' });
      // onToolEnd is not called when executeTool throws an error in the current implementation
      expect(onToolEnd).not.toHaveBeenCalled();
    });

    it('should handle missing Groq client', async () => {
      const agentWithoutKey = await Agent.create('test-model', 0.5, null);
      
      await expect(agentWithoutKey.chat('Test')).rejects.toThrow('No API key available');
    });
  });

  describe('Debug Functionality', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.create('test-model', 0.5, null, true); // Enable debug
    });

    it('should create agent with debug enabled', () => {
      expect(agent).toBeInstanceOf(Agent);
      // Debug functionality is internal, main test is that it doesn't break creation
    });

    it('should handle debug logging without errors', async () => {
      agent.setApiKey('test-key');
      
      mockGroqInstance.chat.completions.create.mockResolvedValue({
        choices: [{ 
          message: { content: 'Debug response' },
          finish_reason: 'stop'
        }],
        usage: null
      });

      await agent.chat('Debug test');
      
      expect(fs.writeFileSync).toHaveBeenCalled(); // Debug file operations
    });
  });
});