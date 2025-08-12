import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailableCommands, getCommandNames, handleSlashCommand, CommandContext } from '@src/commands/index';

describe('getAvailableCommands', () => {
  it('should return an array of command definitions', () => {
    const commands = getAvailableCommands();
    
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
    
    // Verify all commands have required properties
    commands.forEach(command => {
      expect(command).toHaveProperty('command');
      expect(command).toHaveProperty('description');
      expect(command).toHaveProperty('handler');
      expect(typeof command.command).toBe('string');
      expect(typeof command.description).toBe('string');
      expect(typeof command.handler).toBe('function');
    });
  });

  it('should return a copy of commands array (not mutate original)', () => {
    const commands1 = getAvailableCommands();
    const commands2 = getAvailableCommands();
    
    expect(commands1).not.toBe(commands2); // Different array instances
    expect(commands1).toEqual(commands2); // Same content
    
    // Modify one array
    commands1.pop();
    
    // Original should be unchanged
    expect(commands1.length).not.toEqual(commands2.length);
  });

  it('should include expected command types', () => {
    const commands = getAvailableCommands();
    const commandNames = commands.map(cmd => cmd.command);
    
    expect(commandNames).toContain('help');
    expect(commandNames).toContain('login');
    expect(commandNames).toContain('model');
    expect(commandNames).toContain('clear');
    expect(commandNames).toContain('reasoning');
  });
});

describe('getCommandNames', () => {
  it('should return array of command names', () => {
    const commandNames = getCommandNames();
    
    expect(Array.isArray(commandNames)).toBe(true);
    expect(commandNames.length).toBeGreaterThan(0);
    
    commandNames.forEach(name => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });

  it('should return lowercase command names', () => {
    const commandNames = getCommandNames();
    
    commandNames.forEach(name => {
      expect(name).toBe(name.toLowerCase());
    });
  });

  it('should match command names from getAvailableCommands', () => {
    const commands = getAvailableCommands();
    const commandNames = getCommandNames();
    const expectedNames = commands.map(cmd => cmd.command);
    
    expect(commandNames).toEqual(expectedNames);
  });
});

describe('handleSlashCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      setShowModelSelector: vi.fn(),
      toggleReasoning: vi.fn(),
      showReasoning: false,
    };
  });

  it('should add user message for any command', () => {
    handleSlashCommand('/help', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/help',
    });
  });

  it('should execute valid command handler', () => {
    handleSlashCommand('/clear', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledTimes(2); // User message + system message
    expect(mockContext.clearHistory).toHaveBeenCalled();
  });

  it('should handle command with case insensitivity', () => {
    handleSlashCommand('/HELP', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/HELP',
    });
    // Should still execute the help command
    expect(mockContext.addMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle command with mixed case', () => {
    handleSlashCommand('/Help', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/Help',
    });
    // Should still execute the help command
    expect(mockContext.addMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle command with arguments (space separated)', () => {
    handleSlashCommand('/help some arguments here', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/help some arguments here',
    });
    // Should still execute the help command (ignoring arguments)
    expect(mockContext.addMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle unknown command gracefully', () => {
    handleSlashCommand('/unknown', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/unknown',
    });
    // Should only have the user message (no handler executed)
    expect(mockContext.addMessage).toHaveBeenCalledTimes(1);
  });

  it('should extract command name correctly from complex input', () => {
    const spy = vi.spyOn(mockContext, 'setShowLogin');
    handleSlashCommand('/login with additional text', mockContext);
    
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should handle command without space at the end', () => {
    handleSlashCommand('/model', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/model',
    });
    expect(mockContext.setShowModelSelector).toHaveBeenCalledWith(true);
  });

  it('should handle empty command gracefully', () => {
    handleSlashCommand('/', mockContext);
    
    expect(mockContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/',
    });
    // Should only have the user message
    expect(mockContext.addMessage).toHaveBeenCalledTimes(1);
  });

  it('should handle reasoning command toggle', () => {
    mockContext.showReasoning = false;
    handleSlashCommand('/reasoning', mockContext);
    
    expect(mockContext.toggleReasoning).toHaveBeenCalled();
    expect(mockContext.addMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle commands with different function availability', () => {
    // Test with minimal context (some functions undefined)
    const minimalContext: CommandContext = {
      addMessage: vi.fn(),
      clearHistory: vi.fn(),
      setShowLogin: vi.fn(),
      // Missing optional functions
    };

    handleSlashCommand('/model', minimalContext);
    
    expect(minimalContext.addMessage).toHaveBeenCalledWith({
      role: 'user',
      content: '/model',
    });
    // Model command should handle missing setShowModelSelector gracefully
    expect(minimalContext.addMessage).toHaveBeenCalledTimes(1);
  });

  it('should handle all available commands', () => {
    const commands = getAvailableCommands();
    
    commands.forEach(cmd => {
      const freshContext: CommandContext = {
        addMessage: vi.fn(),
        clearHistory: vi.fn(),
        setShowLogin: vi.fn(),
        setShowModelSelector: vi.fn(),
        toggleReasoning: vi.fn(),
        showReasoning: false,
      };

      expect(() => {
        handleSlashCommand(`/${cmd.command}`, freshContext);
      }).not.toThrow();

      expect(freshContext.addMessage).toHaveBeenCalledWith({
        role: 'user',
        content: `/${cmd.command}`,
      });
    });
  });
});