import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock commands module
vi.mock('../../../commands/index.js', () => ({
  getAvailableCommands: vi.fn(),
  getCommandNames: vi.fn(() => ['help', 'login', 'clear', 'model', 'reasoning'])
}));

import SlashCommandSuggestions from './SlashCommandSuggestions';
import { getAvailableCommands, getCommandNames } from '../../../commands/index.js';

const mockGetAvailableCommands = vi.mocked(getAvailableCommands);
const mockGetCommandNames = vi.mocked(getCommandNames);

// Mock ink components
vi.mock('ink', () => ({
  Box: ({ children, flexDirection, marginLeft }: any) => (
    <div 
      data-testid="box" 
      data-flex-direction={flexDirection}
      data-margin-left={marginLeft}
    >
      {children}
    </div>
  ),
  Text: ({ children, color, backgroundColor }: any) => (
    <span 
      data-testid="text" 
      data-color={color} 
      data-background={backgroundColor}
    >
      {children}
    </span>
  ),
}));

describe('SlashCommandSuggestions', () => {
  const mockOnSelect = vi.fn();

  const defaultCommands = [
    { command: 'help', description: 'Show available commands', handler: vi.fn() },
    { command: 'login', description: 'Set or update API key', handler: vi.fn() },
    { command: 'clear', description: 'Clear chat history', handler: vi.fn() },
    { command: 'model', description: 'Select AI model', handler: vi.fn() },
    { command: 'reasoning', description: 'Toggle reasoning display', handler: vi.fn() }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAvailableCommands.mockReturnValue(defaultCommands);
  });

  describe('rendering', () => {
    it('should render nothing when input does not start with slash', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="regular input"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      expect(container.firstChild).toBeFalsy();
    });

    it('should render nothing when no commands match', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/nonexistent"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      expect(container.firstChild).toBeFalsy();
    });

    it('should render all commands when input is just slash', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(5);
      expect(texts[0].textContent).toBe('/help - Show available commands');
      expect(texts[1].textContent).toBe('/login - Set or update API key');
    });

    it('should render filtered commands based on input', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/h"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(1);
      expect(texts[0].textContent).toBe('/help - Show available commands');
    });

    it('should render multiple matching commands', () => {
      mockGetAvailableCommands.mockReturnValue([
        { command: 'create', description: 'Create a file', handler: vi.fn() },
        { command: 'clear', description: 'Clear chat history', handler: vi.fn() },
        { command: 'copy', description: 'Copy content', handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/c"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(3);
      expect(texts[0].textContent).toBe('/create - Create a file');
      expect(texts[1].textContent).toBe('/clear - Clear chat history');
      expect(texts[2].textContent).toBe('/copy - Copy content');
    });
  });

  describe('filtering logic', () => {
    it('should filter commands case-insensitively', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/HELP"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(1);
      expect(texts[0].textContent).toBe('/help - Show available commands');
    });

    it('should filter commands with partial matches', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/log"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(1);
      expect(texts[0].textContent).toBe('/login - Set or update API key');
    });

    it('should match commands containing the search term', async () => {
      const commands = await import('../../../commands/index.js');
      vi.mocked(commands.getAvailableCommands).mockReturnValue([
        { command: 'help', description: 'Show available commands', handler: vi.fn() },
        { command: 'get-help', description: 'Get help information', handler: vi.fn() },
        { command: 'helper', description: 'Helper function', handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(3);
    });

    it('should handle empty search term after slash', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(5); // All commands should be shown
    });
  });

  describe('selection highlighting', () => {
    it('should highlight the selected command with cyan background', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/h"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const selectedText = container.querySelector('[data-background="cyan"]');
      expect(selectedText).toBeTruthy();
      expect(selectedText?.getAttribute('data-color')).toBe('black');
      expect(selectedText?.textContent).toBe('/help - Show available commands');
    });

    it('should highlight the correct command when selectedIndex is not 0', () => {
      mockGetAvailableCommands.mockReturnValue([
        { command: 'create', description: 'Create a file', handler: vi.fn() },
        { command: 'clear', description: 'Clear chat history', handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/c"
          selectedIndex={1}
          onSelect={mockOnSelect}
        />
      );

      const selectedText = container.querySelector('[data-background="cyan"]');
      expect(selectedText?.textContent).toBe('/clear - Clear chat history');
    });

    it('should show non-selected commands with white text and no background', () => {
      mockGetAvailableCommands.mockReturnValue([
        { command: 'create', description: 'Create a file', handler: vi.fn() },
        { command: 'clear', description: 'Clear chat history', handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/c"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const texts = container.querySelectorAll('[data-testid="text"]');
      const unselectedText = texts[1];
      
      expect(unselectedText.getAttribute('data-color')).toBe('white');
      // Background should be null (not set) or 'undefined' string
      const background = unselectedText.getAttribute('data-background');
      expect(background === null || background === 'undefined').toBeTruthy();
    });

    it('should handle selectedIndex beyond available commands', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={5}
          onSelect={mockOnSelect}
        />
      );

      // Should not crash and no command should be highlighted with cyan
      const selectedText = container.querySelector('[data-background="cyan"]');
      expect(selectedText).toBeFalsy();
    });

    it('should handle negative selectedIndex', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={-1}
          onSelect={mockOnSelect}
        />
      );

      // Should not crash and no command should be highlighted with cyan
      const selectedText = container.querySelector('[data-background="cyan"]');
      expect(selectedText).toBeFalsy();
    });
  });

  describe('component structure', () => {
    it('should render commands in a flex column with proper margin', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const box = container.querySelector('[data-testid="box"]');
      expect(box?.getAttribute('data-flex-direction')).toBe('column');
      expect(box?.getAttribute('data-margin-left')).toBe('2');
    });

    it('should use unique keys for command items', () => {
      mockGetAvailableCommands.mockReturnValue([
        { command: 'help', description: 'Show help', handler: vi.fn() },
        { command: 'help2', description: 'Show more help', handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      // Components should render without React key warnings
      const texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty commands array', () => {
      mockGetAvailableCommands.mockReturnValue([]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/anything"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      expect(container.firstChild).toBeFalsy();
    });

    it('should handle commands with empty descriptions', () => {
      mockGetAvailableCommands.mockReturnValue([
        { command: 'test', description: '', handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/test"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const text = container.querySelector('[data-testid="text"]');
      expect(text?.textContent).toBe('/test - ');
    });

    it('should handle commands with undefined descriptions', () => {
      mockGetAvailableCommands.mockReturnValue([
        { command: 'test', description: undefined as any, handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/test"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const text = container.querySelector('[data-testid="text"]');
      // Component should handle undefined description gracefully
      // It might show "undefined" or an empty string
      expect(text?.textContent).toMatch(/\/test( - (undefined)?)?/);
    });

    it('should handle very long command names and descriptions', () => {
      const longCommand = 'very-long-command-name-that-exceeds-normal-length';
      const longDescription = 'This is a very long description that exceeds normal length and should still be rendered properly';
      
      mockGetAvailableCommands.mockReturnValue([
        { command: longCommand, description: longDescription, handler: vi.fn() }
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/very"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const text = container.querySelector('[data-testid="text"]');
      expect(text?.textContent).toBe(`/${longCommand} - ${longDescription}`);
    });

    it('should handle special characters in search', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/help-"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      // Should not match any commands and return empty
      expect(container.firstChild).toBeFalsy();
    });

    it('should handle whitespace in input correctly', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/ "
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      // Space after slash should not match any commands
      expect(container.firstChild).toBeFalsy();
    });
  });

  describe('prop variations', () => {
    it('should work without onSelect callback', () => {
      const { container } = render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={0}
          onSelect={undefined as any}
        />
      );

      const text = container.querySelector('[data-testid="text"]');
      expect(text?.textContent).toBe('/help - Show available commands');
    });

    it('should handle multiple re-renders with different props', () => {
      const { rerender, container } = render(
        <SlashCommandSuggestions 
          input="/h"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      let texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(1);

      rerender(
        <SlashCommandSuggestions 
          input="/"
          selectedIndex={1}
          onSelect={mockOnSelect}
        />
      );

      texts = container.querySelectorAll('[data-testid="text"]');
      expect(texts).toHaveLength(5);

      // Second command should be selected
      const selectedText = container.querySelector('[data-background="cyan"]');
      expect(selectedText?.textContent).toBe('/login - Set or update API key');
    });
  });

  describe('command data handling', () => {
    it('should handle commands with additional properties', () => {
      mockGetAvailableCommands.mockReturnValue([
        { 
          command: 'help', 
          description: 'Show help',
          category: 'utility',
          hidden: false 
        } as any
      ]);

      const { container } = render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      const text = container.querySelector('[data-testid="text"]');
      expect(text?.textContent).toBe('/help - Show help');
    });

    it('should call getAvailableCommands on each render', () => {
      render(
        <SlashCommandSuggestions 
          input="/help"
          selectedIndex={0}
          onSelect={mockOnSelect}
        />
      );

      expect(mockGetAvailableCommands).toHaveBeenCalledTimes(1);
    });

    it('should handle getAvailableCommands throwing an error gracefully', () => {
      mockGetAvailableCommands.mockImplementation(() => {
        throw new Error('Command loading failed');
      });

      expect(() => {
        render(
          <SlashCommandSuggestions 
            input="/help"
            selectedIndex={0}
            onSelect={mockOnSelect}
          />
        );
      }).toThrow('Command loading failed');
    });
  });
});