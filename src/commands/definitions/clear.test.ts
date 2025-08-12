import { describe, it, expect, vi } from 'vitest';
import { clearCommand } from './clear.js';
import { CommandContext } from '../base.js';

describe('clearCommand', () => {
  it('should have correct command properties', () => {
    expect(clearCommand.command).toBe('clear');
    expect(clearCommand.description).toBe('Clear chat history and context');
    expect(typeof clearCommand.handler).toBe('function');
  });

  it('should call clearHistory and add confirmation message', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    clearCommand.handler(mockContext);

    expect(mockContext.clearHistory).toHaveBeenCalledTimes(1);
    expect(mockContext.addMessage).toHaveBeenCalledTimes(1);
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Chat history and context cleared.',
    });
  });

  it('should call clearHistory before adding message', () => {
    const callOrder: string[] = [];
    const mockContext: CommandContext = {
      addMessage: vi.fn(() => callOrder.push('addMessage')),
      clearHistory: vi.fn(() => callOrder.push('clearHistory')),
      setShowLogin: vi.fn(),
    };

    clearCommand.handler(mockContext);

    expect(callOrder).toEqual(['clearHistory', 'addMessage']);
  });

  it('should not call other context methods', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
    };

    clearCommand.handler(mockContext);

    expect(mockContext.setShowLogin).not.toHaveBeenCalled();
    expect(mockContext.setShowModelSelector).not.toHaveBeenCalled();
    expect(mockContext.toggleReasoning).not.toHaveBeenCalled();
  });

  it('should handle context destructuring correctly', () => {
    const mockAddMessage = vi.fn();
    const mockClearHistory = vi.fn();
    
    const mockContext: CommandContext = {
      addMessage: mockAddMessage,
      clearHistory: mockClearHistory,
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: false,
    };

    clearCommand.handler(mockContext);

    expect(mockClearHistory).toHaveBeenCalledTimes(1);
    expect(mockAddMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Chat history and context cleared.',
    });
  });

  it('should work with minimal context', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    expect(() => clearCommand.handler(mockContext)).not.toThrow();
    expect(mockContext.clearHistory).toHaveBeenCalled();
    expect(mockContext.addMessage).toHaveBeenCalled();
  });

  it('should add system message with correct content', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    clearCommand.handler(mockContext);

    const call = vi.mocked(mockContext.addMessage).mock.calls[0][0];
    expect(call).toEqual({
      role: 'system',
      content: 'Chat history and context cleared.',
    });
  });
});