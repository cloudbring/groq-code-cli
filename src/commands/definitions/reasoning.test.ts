import { describe, it, expect, vi } from 'vitest';
import { reasoningCommand } from './reasoning.js';
import { CommandContext } from '../base.js';

describe('reasoningCommand', () => {
  it('should have correct command properties', () => {
    expect(reasoningCommand.command).toBe('reasoning');
    expect(reasoningCommand.description).toBe('Toggle display of reasoning content in messages');
    expect(typeof reasoningCommand.handler).toBe('function');
  });

  it('should toggle reasoning and add enabled message when showReasoning is false', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: false,
    };

    reasoningCommand.handler(mockContext);

    expect(mockContext.toggleReasoning).toHaveBeenCalledTimes(1);
    expect(mockContext.addMessage).toHaveBeenCalledTimes(1);
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning display is now enabled.',
    });
  });

  it('should toggle reasoning and add disabled message when showReasoning is true', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: true,
    };

    reasoningCommand.handler(mockContext);

    expect(mockContext.toggleReasoning).toHaveBeenCalledTimes(1);
    expect(mockContext.addMessage).toHaveBeenCalledTimes(1);
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning display is now disabled.',
    });
  });

  it('should show not available message when toggleReasoning is undefined', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      // toggleReasoning is undefined
      // showReasoning is undefined
    };

    reasoningCommand.handler(mockContext);

    expect(mockContext.addMessage).toHaveBeenCalledTimes(1);
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning toggle functionality is not available.',
    });
  });

  it('should show not available message when toggleReasoning is null', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: undefined,
      showReasoning: undefined,
    };

    reasoningCommand.handler(mockContext);

    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning toggle functionality is not available.',
    });
  });

  it('should handle showReasoning being undefined when toggleReasoning exists', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: vi.fn(),
      // showReasoning is undefined
    };

    reasoningCommand.handler(mockContext);

    expect(mockContext.toggleReasoning).toHaveBeenCalled();
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning display is now enabled.', // !undefined = true
    });
  });

  it('should not call other context methods when toggleReasoning is available', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: false,
      setShowModelSelector: vi.fn(),
    };

    reasoningCommand.handler(mockContext);

    expect(mockContext.clearHistory).not.toHaveBeenCalled();
    expect(mockContext.setShowLogin).not.toHaveBeenCalled();
    expect(mockContext.setShowModelSelector).not.toHaveBeenCalled();
  });

  it('should not call other context methods when toggleReasoning is unavailable', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      // toggleReasoning is undefined
    };

    reasoningCommand.handler(mockContext);

    expect(mockContext.clearHistory).not.toHaveBeenCalled();
    expect(mockContext.setShowLogin).not.toHaveBeenCalled();
    expect(mockContext.setShowModelSelector).not.toHaveBeenCalled();
  });

  it('should handle context destructuring correctly', () => {
    const mockAddMessage = vi.fn();
    const mockToggleReasoning = vi.fn();
    
    const mockContext: CommandContext = {
      addMessage: mockAddMessage,
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: mockToggleReasoning,
      showReasoning: true,
    };

    reasoningCommand.handler(mockContext);

    expect(mockToggleReasoning).toHaveBeenCalledTimes(1);
    expect(mockAddMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning display is now disabled.',
    });
  });

  it('should work with minimal context when toggleReasoning is unavailable', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    expect(() => reasoningCommand.handler(mockContext)).not.toThrow();
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning toggle functionality is not available.',
    });
  });

  it('should correctly invert showReasoning state in message', () => {
    // Test false -> enabled
    const mockContextFalse: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: false,
    };

    reasoningCommand.handler(mockContextFalse);
    expect(mockContextFalse.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning display is now enabled.',
    });

    // Test true -> disabled
    const mockContextTrue: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: true,
    };

    reasoningCommand.handler(mockContextTrue);
    expect(mockContextTrue.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Reasoning display is now disabled.',
    });
  });
});