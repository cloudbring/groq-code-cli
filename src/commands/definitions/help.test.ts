import { describe, it, expect, vi } from 'vitest';
import { helpCommand } from './help.js';
import { CommandContext } from '../base.js';

// Mock the getAvailableCommands to avoid circular dependency
vi.mock('../index.js', () => ({
  getAvailableCommands: () => [
    { command: 'help', description: 'Show help and available commands' },
    { command: 'login', description: 'Login with Groq API key' },
    { command: 'model', description: 'Select AI model' },
    { command: 'clear', description: 'Clear chat history' },
    { command: 'reasoning', description: 'Toggle reasoning mode' },
  ]
}));

describe('helpCommand', () => {
  it('should have correct command properties', () => {
    expect(helpCommand.command).toBe('help');
    expect(helpCommand.description).toBe('Show help and available commands');
    expect(typeof helpCommand.handler).toBe('function');
  });

  it('should add system message with help content', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    helpCommand.handler(mockContext);

    expect(mockContext.addMessage).toHaveBeenCalledTimes(1);
    
    const call = vi.mocked(mockContext.addMessage).mock.calls[0][0];
    expect(call.role).toBe('system');
    expect(call.content).toContain('Available Commands:');
    expect(call.content).toContain('/help - Show help and available commands');
    expect(call.content).toContain('Navigation:');
    expect(call.content).toContain('Keyboard Shortcuts:');
    expect(call.content).toContain('Groq');
  });

  it('should include all available commands in help message', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    helpCommand.handler(mockContext);

    const call = vi.mocked(mockContext.addMessage).mock.calls[0][0];
    const content = call.content;

    // Should include various commands
    expect(content).toContain('/help');
    expect(content).toContain('/login');
    expect(content).toContain('/model');
    expect(content).toContain('/clear');
    expect(content).toContain('/reasoning');
  });

  it('should include navigation instructions', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    helpCommand.handler(mockContext);

    const call = vi.mocked(mockContext.addMessage).mock.calls[0][0];
    const content = call.content;

    expect(content).toContain('arrow keys');
    expect(content).toContain('Enter to execute');
    expect(content).toContain('Type \'/\'');
  });

  it('should include keyboard shortcuts', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    helpCommand.handler(mockContext);

    const call = vi.mocked(mockContext.addMessage).mock.calls[0][0];
    const content = call.content;

    expect(content).toContain('Esc');
    expect(content).toContain('Shift+Tab');
    expect(content).toContain('Ctrl+C');
    expect(content).toContain('Clear input box');
    expect(content).toContain('Toggle auto-approval');
    expect(content).toContain('Exit the application');
  });

  it('should include application description', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    helpCommand.handler(mockContext);

    const call = vi.mocked(mockContext.addMessage).mock.calls[0][0];
    const content = call.content;

    expect(content).toContain('lightweight');
    expect(content).toContain('open-source');
    expect(content).toContain('coding CLI');
    expect(content).toContain('powered by Groq');
  });

  it('should not call other context methods', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
    };

    helpCommand.handler(mockContext);

    expect(mockContext.clearHistory).not.toHaveBeenCalled();
    expect(mockContext.setShowLogin).not.toHaveBeenCalled();
    expect(mockContext.setShowModelSelector).not.toHaveBeenCalled();
    expect(mockContext.toggleReasoning).not.toHaveBeenCalled();
  });
});