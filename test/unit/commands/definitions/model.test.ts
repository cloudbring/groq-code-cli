import { describe, it, expect, vi } from 'vitest';
import { modelCommand } from '@src/commands/definitions/model';
import { CommandContext } from '@src/commands/base';

describe('modelCommand', () => {
  it('should have correct command properties', () => {
    expect(modelCommand.command).toBe('model');
    expect(modelCommand.description).toBe('Select your Groq model');
    expect(typeof modelCommand.handler).toBe('function');
  });

  it('should call setShowModelSelector with true when available', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
    };

    modelCommand.handler(mockContext);

    expect(mockContext.setShowModelSelector).toHaveBeenCalledTimes(1);
    expect(mockContext.setShowModelSelector).toHaveBeenCalledWith(true);
  });

  it('should not crash when setShowModelSelector is undefined', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      // setShowModelSelector is undefined
    };

    expect(() => modelCommand.handler(mockContext)).not.toThrow();
  });

  it('should not call setShowModelSelector when it is undefined', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      // setShowModelSelector is undefined
    };

    modelCommand.handler(mockContext);

    // Should not throw and should not call other methods unnecessarily
    expect(mockContext.addMessage).not.toHaveBeenCalled();
    expect(mockContext.clearHistory).not.toHaveBeenCalled();
    expect(mockContext.setShowLogin).not.toHaveBeenCalled();
  });

  it('should not call other context methods when setShowModelSelector is available', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
    };

    modelCommand.handler(mockContext);

    expect(mockContext.addMessage).not.toHaveBeenCalled();
    expect(mockContext.clearHistory).not.toHaveBeenCalled();
    expect(mockContext.setShowLogin).not.toHaveBeenCalled();
    expect(mockContext.toggleReasoning).not.toHaveBeenCalled();
  });

  it('should handle context destructuring correctly', () => {
    const mockSetShowModelSelector = vi.fn();
    
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: mockSetShowModelSelector,
      toggleReasoning: vi.fn(),
      showReasoning: false,
    };

    modelCommand.handler(mockContext);

    expect(mockSetShowModelSelector).toHaveBeenCalledWith(true);
  });

  it('should check for setShowModelSelector existence before calling', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: undefined, // Explicitly undefined
    };

    expect(() => modelCommand.handler(mockContext)).not.toThrow();
  });

  it('should work correctly with all optional properties present', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: true,
    };

    modelCommand.handler(mockContext);

    expect(mockContext.setShowModelSelector).toHaveBeenCalledWith(true);
    // Other methods should not be called
    expect(mockContext.addMessage).not.toHaveBeenCalled();
    expect(mockContext.clearHistory).not.toHaveBeenCalled();
    expect(mockContext.setShowLogin).not.toHaveBeenCalled();
    expect(mockContext.toggleReasoning).not.toHaveBeenCalled();
  });
});