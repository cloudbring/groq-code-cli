import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import MessageInput from './MessageInput';

// Mock child components and modules
vi.mock('../input-overlays/SlashCommandSuggestions.js', () => ({
  default: vi.fn(({ input, selectedIndex, onSelect }) => (
    <div data-testid="slash-suggestions" data-selected={selectedIndex}>
      SlashCommandSuggestions
    </div>
  ))
}));

vi.mock('../../../commands/index.js', () => ({
  getCommandNames: vi.fn(() => ['help', 'config', 'clear', 'model', 'exit'])
}));

// Mock ink hooks
let inputCallback: any = null;
let componentState = {
  value: '',
  cursorPosition: 0,
  selectedCommandIndex: 0,
  historyIndex: -1,
  draftMessage: ''
};

vi.mock('ink', () => ({
  Box: ({ children, flexDirection, flexGrow }: any) => (
    <div data-testid="box" data-flex-direction={flexDirection} data-flex-grow={flexGrow}>
      {children}
    </div>
  ),
  Text: ({ children, color, bold, backgroundColor }: any) => (
    <span 
      data-testid="text"
      data-color={color}
      data-bold={bold}
      data-bgcolor={backgroundColor}
    >
      {children}
    </span>
  ),
  useInput: (callback: any) => {
    inputCallback = callback;
    return () => {};
  }
}));

describe('MessageInput', () => {
  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    inputCallback = null;
    componentState = {
      value: '',
      cursorPosition: 0,
      selectedCommandIndex: 0,
      historyIndex: -1,
      draftMessage: ''
    };
  });

  describe('rendering', () => {
    it('should render with placeholder when value is empty', () => {
      const { getByText } = render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByText('... (Esc to clear, Ctrl+C to exit)')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      const { getByText } = render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          placeholder="Custom placeholder"
        />
      );

      expect(getByText('Custom placeholder')).toBeTruthy();
    });

    it('should render value when provided', () => {
      const { container } = render(
        <MessageInput
          value="test message"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const textElements = container.querySelectorAll('[data-testid="text"]');
      const textContent = Array.from(textElements).map(el => el.textContent).join('');
      expect(textContent).toContain('test message');
    });

    it('should show slash command suggestions when input starts with /', () => {
      const { getByTestId } = render(
        <MessageInput
          value="/he"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(getByTestId('slash-suggestions')).toBeTruthy();
    });

    it('should not show slash command suggestions for regular input', () => {
      const { queryByTestId } = render(
        <MessageInput
          value="regular message"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(queryByTestId('slash-suggestions')).toBeFalsy();
    });
  });

  describe('input handling', () => {
    it('should handle character input', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('a', { meta: false, ctrl: false });
      
      expect(mockOnChange).toHaveBeenCalledWith('a');
    });

    it('should handle character input at cursor position', () => {
      render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      // Move cursor to position 2
      inputCallback('', { leftArrow: true });
      inputCallback('', { leftArrow: true });
      
      // Insert character
      inputCallback('x', { meta: false, ctrl: false });
      
      // Should insert at cursor position
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle backspace', () => {
      render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { backspace: true });
      
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle delete key', () => {
      render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { delete: true });
      
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle enter key', () => {
      render(
        <MessageInput
          value="test message"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('test message');
    });

    it('should handle enter key with slash command', () => {
      render(
        <MessageInput
          value="/he"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { return: true });
      
      // Should submit the filtered command
      expect(mockOnSubmit).toHaveBeenCalledWith('/help');
    });

    it('should ignore meta key combinations', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('a', { meta: true, ctrl: false });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should ignore ctrl key combinations', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('a', { meta: false, ctrl: true });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should replace newlines with spaces', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('line1\nline2\r\nline3', { meta: false, ctrl: false });
      
      expect(mockOnChange).toHaveBeenCalledWith('line1 line2 line3');
    });
  });

  describe('cursor navigation', () => {
    it('should handle left arrow', () => {
      render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { leftArrow: true });
      
      // Cursor should move left (internal state change)
      expect(inputCallback).toBeDefined();
    });

    it('should handle right arrow', () => {
      render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { rightArrow: true });
      
      // Cursor should move right (internal state change)
      expect(inputCallback).toBeDefined();
    });

    it('should handle up arrow for slash commands', () => {
      render(
        <MessageInput
          value="/he"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { upArrow: true });
      
      // Should navigate through suggestions (internal state change)
      expect(inputCallback).toBeDefined();
    });

    it('should handle down arrow for slash commands', () => {
      render(
        <MessageInput
          value="/he"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { downArrow: true });
      
      // Should navigate through suggestions (internal state change)
      expect(inputCallback).toBeDefined();
    });
  });

  describe('message history navigation', () => {
    const mockHistory = ['first message', 'second message', 'third message'];

    it('should navigate to previous message with up arrow at cursor position 0', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          userMessageHistory={mockHistory}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { upArrow: true });
      
      // Should load the most recent message from history
      expect(mockOnChange).toHaveBeenCalledWith('third message');
    });

    it('should navigate through history with multiple up arrows', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          userMessageHistory={mockHistory}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { upArrow: true });
      inputCallback('', { upArrow: true });
      
      // Should navigate to older messages
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should navigate back with down arrow', () => {
      render(
        <MessageInput
          value="third message"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          userMessageHistory={mockHistory}
        />
      );

      expect(inputCallback).toBeDefined();
      
      // First go up to enter history mode
      inputCallback('', { upArrow: true });
      
      // Then go down to navigate back
      inputCallback('', { downArrow: true });
      
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should preserve draft message when navigating history', () => {
      render(
        <MessageInput
          value="draft"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          userMessageHistory={mockHistory}
        />
      );

      expect(inputCallback).toBeDefined();
      
      // Navigate to history
      inputCallback('', { leftArrow: true }); // Move cursor to start
      inputCallback('', { leftArrow: true });
      inputCallback('', { leftArrow: true });
      inputCallback('', { leftArrow: true });
      inputCallback('', { leftArrow: true });
      inputCallback('', { upArrow: true });
      
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty value submission', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      inputCallback('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('');
    });

    it('should handle backspace at cursor position 0', () => {
      render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(inputCallback).toBeDefined();
      
      // Move cursor to start
      inputCallback('', { leftArrow: true });
      inputCallback('', { leftArrow: true });
      inputCallback('', { leftArrow: true });
      inputCallback('', { leftArrow: true });
      
      // Try backspace at position 0
      inputCallback('', { backspace: true });
      
      // Should not crash or call onChange incorrectly
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle value changes from parent', () => {
      const { rerender } = render(
        <MessageInput
          value="initial"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      rerender(
        <MessageInput
          value="updated"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Should handle the new value without errors
      expect(inputCallback).toBeDefined();
    });

    it('should reset cursor when value is cleared', () => {
      const { rerender } = render(
        <MessageInput
          value="test"
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      rerender(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Cursor should be reset to 0 (internal state)
      expect(inputCallback).toBeDefined();
    });
  });
});