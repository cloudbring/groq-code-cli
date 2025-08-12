import { describe, it, expect, vi } from 'vitest';
import { loginCommand } from '@src/commands/definitions/login';
import { CommandContext } from '@src/commands/base';

describe('loginCommand', () => {
  it('should have correct command properties', () => {
    expect(loginCommand.command).toBe('login');
    expect(loginCommand.description).toBe('Login with your credentials');
    expect(typeof loginCommand.handler).toBe('function');
  });

  it('should call setShowLogin with true', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    loginCommand.handler(mockContext);

    expect(mockContext.setShowLogin).toHaveBeenCalledTimes(1);
    expect(mockContext.setShowLogin).toHaveBeenCalledWith(true);
  });

  it('should not call other context methods', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
    };

    loginCommand.handler(mockContext);

    expect(mockContext.addMessage).not.toHaveBeenCalled();
    expect(mockContext.clearHistory).not.toHaveBeenCalled();
    expect(mockContext.setShowModelSelector).not.toHaveBeenCalled();
    expect(mockContext.toggleReasoning).not.toHaveBeenCalled();
  });

  it('should work with minimal context', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    expect(() => loginCommand.handler(mockContext)).not.toThrow();
    expect(mockContext.setShowLogin).toHaveBeenCalledWith(true);
  });

  it('should handle context destructuring correctly', () => {
    const mockSetShowLogin = vi.fn();
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: mockSetShowLogin,
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: false,
    };

    loginCommand.handler(mockContext);

    expect(mockSetShowLogin).toHaveBeenCalledWith(true);
  });
});