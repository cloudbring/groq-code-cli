import { describe, it, expect, vi } from 'vitest';
import { BaseCommand, CommandContext, CommandDefinition } from '@src/commands/base';

describe('CommandContext', () => {
  it('should define correct interface structure', () => {
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: true,
    };

    expect(mockContext.addMessage).toBeDefined();
    expect(mockContext.clearHistory).toBeDefined();
    expect(mockContext.setShowLogin).toBeDefined();
    expect(mockContext.setShowModelSelector).toBeDefined();
    expect(mockContext.toggleReasoning).toBeDefined();
    expect(typeof mockContext.showReasoning).toBe('boolean');
  });

  it('should work with minimal required properties', () => {
    const minimalContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    expect(minimalContext.addMessage).toBeDefined();
    expect(minimalContext.clearHistory).toBeDefined();
    expect(minimalContext.setShowLogin).toBeDefined();
    expect(minimalContext.setShowModelSelector).toBeUndefined();
    expect(minimalContext.toggleReasoning).toBeUndefined();
    expect(minimalContext.showReasoning).toBeUndefined();
  });
});

describe('CommandDefinition', () => {
  it('should define correct interface structure', () => {
    const mockHandler = vi.fn();
    const mockDefinition: CommandDefinition = {
      command: 'test',
      description: 'Test command',
      handler: mockHandler,
    };

    expect(mockDefinition.command).toBe('test');
    expect(mockDefinition.description).toBe('Test command');
    expect(mockDefinition.handler).toBe(mockHandler);
  });
});

describe('BaseCommand', () => {
  class TestCommand extends BaseCommand {
    command = 'test';
    description = 'Test command for unit tests';
    
    handler(context: CommandContext): void {
      context.addMessage({
        role: 'system',
        content: 'Test message',
      });
    }
  }

  it('should create a command instance with required properties', () => {
    const testCommand = new TestCommand();
    
    expect(testCommand.command).toBe('test');
    expect(testCommand.description).toBe('Test command for unit tests');
    expect(typeof testCommand.handler).toBe('function');
  });

  it('should execute handler correctly', () => {
    const testCommand = new TestCommand();
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
    };

    testCommand.handler(mockContext);

    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'system',
      content: 'Test message',
    });
  });

  it('should implement CommandDefinition interface', () => {
    const testCommand = new TestCommand();
    
    // Should be assignable to CommandDefinition
    const definition: CommandDefinition = testCommand;
    
    expect(definition.command).toBe('test');
    expect(definition.description).toBe('Test command for unit tests');
    expect(typeof definition.handler).toBe('function');
  });

  class AnotherTestCommand extends BaseCommand {
    command = 'another';
    description = 'Another test command';
    
    handler(context: CommandContext): void {
      if (context.setShowModelSelector) {
        context.setShowModelSelector(true);
      }
      context.clearHistory();
    }
  }

  it('should handle optional context properties', () => {
    const anotherCommand = new AnotherTestCommand();
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
    };

    anotherCommand.handler(mockContext);

    expect(mockContext.setShowModelSelector).toHaveBeenCalledWith(true);
    expect(mockContext.clearHistory).toHaveBeenCalled();
  });

  it('should handle missing optional context properties gracefully', () => {
    const anotherCommand = new AnotherTestCommand();
    const mockContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      // setShowModelSelector is undefined
    };

    expect(() => anotherCommand.handler(mockContext)).not.toThrow();
    expect(mockContext.clearHistory).toHaveBeenCalled();
  });
});