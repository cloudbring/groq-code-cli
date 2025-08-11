import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock ink components
vi.mock('ink', () => ({
  Box: ({ children, flexDirection, marginBottom }: any) => (
    <div data-testid="box" data-flex-direction={flexDirection} data-margin-bottom={marginBottom}>
      {children}
    </div>
  ),
  Text: ({ children, color, bold, underline, backgroundColor }: any) => (
    <span 
      data-testid="text" 
      data-color={color} 
      data-bold={bold}
      data-underline={underline}
      data-bg-color={backgroundColor}
    >
      {children}
    </span>
  ),
  useInput: vi.fn()
}));

import Login from './Login';
import { useInput } from 'ink';

describe('Login', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  let inputHandler: (input: string, key: any) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Capture the input handler
    (useInput as any).mockImplementation((handler: any) => {
      inputHandler = handler;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render login prompt', () => {
      const { getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(getByText('Login with Groq API Key')).toBeTruthy();
      expect(getByText(/Enter your Groq API key to continue/)).toBeTruthy();
      expect(getByText('https://console.groq.com/keys')).toBeTruthy();
      expect(getByText('API Key:')).toBeTruthy();
    });

    it('should render empty API key field initially', () => {
      const { getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Should show API Key: prompt with cursor but no asterisks initially
      expect(getByText('API Key:')).toBeTruthy();
      expect(getByText('▌')).toBeTruthy();
    });

    it('should display cursor', () => {
      const { container } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const cursor = container.querySelector('[data-bg-color="cyan"]');
      expect(cursor).toBeTruthy();
      expect(cursor?.textContent).toBe('▌');
    });
  });

  describe('input handling', () => {
    it('should handle character input and display asterisks', () => {
      const { container, rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'test'
      inputHandler('t', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      inputHandler('e', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      inputHandler('s', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      inputHandler('t', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Should show 4 asterisks
      const texts = container.querySelectorAll('[data-testid="text"]');
      const asteriskText = Array.from(texts).find(el => el.textContent?.includes('****'));
      expect(asteriskText).toBeTruthy();
    });

    it('should handle backspace', () => {
      const { container, rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'abc'
      inputHandler('a', { meta: false, ctrl: false });
      inputHandler('b', { meta: false, ctrl: false });
      inputHandler('c', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Press backspace
      inputHandler('', { backspace: true });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Should show 2 asterisks now
      const texts = container.querySelectorAll('[data-testid="text"]');
      const asteriskText = Array.from(texts).find(el => el.textContent?.includes('**') && !el.textContent?.includes('***'));
      expect(asteriskText).toBeTruthy();
    });

    it('should handle delete key', () => {
      const { container, rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'test'
      inputHandler('t', { meta: false, ctrl: false });
      inputHandler('e', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('t', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Press delete
      inputHandler('', { delete: true });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Should show 3 asterisks now
      const texts = container.querySelectorAll('[data-testid="text"]');
      const asteriskText = Array.from(texts).find(el => el.textContent?.includes('***') && !el.textContent?.includes('****'));
      expect(asteriskText).toBeTruthy();
    });

    it('should handle enter key with valid input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Type API key
      inputHandler('g', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });
      inputHandler('-', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });
      inputHandler('e', { meta: false, ctrl: false });
      inputHandler('y', { meta: false, ctrl: false });

      // Press enter
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('gsk-key');
    });

    it('should handle enter key with empty input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Press enter without typing anything
      inputHandler('', { return: true });

      // Should not call onSubmit with empty input
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle escape key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      inputHandler('', { escape: true });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should handle ctrl+c', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      inputHandler('c', { ctrl: true });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should trim whitespace from API key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Type API key with spaces
      inputHandler(' ', { meta: false, ctrl: false });
      inputHandler(' ', { meta: false, ctrl: false });
      inputHandler('g', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });
      inputHandler(' ', { meta: false, ctrl: false });
      inputHandler(' ', { meta: false, ctrl: false });

      // Press enter
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
    });

    it('should not submit whitespace-only input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Type only spaces
      inputHandler(' ', { meta: false, ctrl: false });
      inputHandler(' ', { meta: false, ctrl: false });
      inputHandler(' ', { meta: false, ctrl: false });

      // Press enter
      inputHandler('', { return: true });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should ignore meta key combinations', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      inputHandler('a', { meta: true, ctrl: false });

      // Meta key input should be ignored - no submission or cancellation
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should ignore ctrl key combinations except ctrl+c', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      inputHandler('a', { meta: false, ctrl: true });

      // Ctrl+a should be ignored
      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should limit asterisk display to 20 characters', () => {
      const { container, rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 25 characters
      for (let i = 0; i < 25; i++) {
        inputHandler('a', { meta: false, ctrl: false });
      }
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Should show exactly 20 asterisks plus ellipsis
      const texts = container.querySelectorAll('[data-testid="text"]');
      const asteriskText = Array.from(texts).find(el => 
        el.textContent?.includes('*'.repeat(20) + '...')
      );
      expect(asteriskText).toBeTruthy();
    });
  });

  describe('complex scenarios', () => {
    it('should handle typing, deleting, and retyping', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Type 'wrong'
      inputHandler('w', { meta: false, ctrl: false });
      inputHandler('r', { meta: false, ctrl: false });
      inputHandler('o', { meta: false, ctrl: false });
      inputHandler('n', { meta: false, ctrl: false });
      inputHandler('g', { meta: false, ctrl: false });

      // Delete all 5 characters
      for (let i = 0; i < 5; i++) {
        inputHandler('', { backspace: true });
      }

      // Type correct key
      inputHandler('g', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });

      // Press enter
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
    });

    it('should handle rapid input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Simulate rapid typing
      const apiKey = 'gsk-1234567890';
      for (const char of apiKey) {
        inputHandler(char, { meta: false, ctrl: false });
      }

      // Press enter
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith(apiKey);
    });

    it('should handle special characters in API key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const specialKey = 'gsk_test-KEY.123!@#';
      for (const char of specialKey) {
        inputHandler(char, { meta: false, ctrl: false });
      }

      // Press enter
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith(specialKey);
    });

    it('should handle very long API keys', () => {
      const { container, rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const longKey = 'gsk-' + 'a'.repeat(100);
      for (const char of longKey) {
        inputHandler(char, { meta: false, ctrl: false });
      }
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Should show 20 asterisks plus ellipsis
      const texts = container.querySelectorAll('[data-testid="text"]');
      const asteriskText = Array.from(texts).find(el => 
        el.textContent?.includes('*'.repeat(20) + '...')
      );
      expect(asteriskText).toBeTruthy();

      // Press enter
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith(longKey);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple escape presses', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      inputHandler('', { escape: true });
      
      // Clear the mock to test second press
      mockOnCancel.mockClear();
      
      inputHandler('', { escape: true });

      // Second escape should still call onCancel
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed control characters', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Type some text
      inputHandler('t', { meta: false, ctrl: false });
      inputHandler('e', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('t', { meta: false, ctrl: false });

      // Try ctrl+a (should be ignored)
      inputHandler('a', { ctrl: true });

      // Try meta+c (should be ignored)  
      inputHandler('c', { meta: true });

      // Actual text should still be there, submit it
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('test');
    });

    it('should handle backspace on empty input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Press backspace on empty input (should not crash)
      inputHandler('', { backspace: true });
      inputHandler('', { backspace: true });

      // Should still be able to type after
      inputHandler('o', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });

      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('ok');
    });

    it('should handle delete on empty input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Press delete on empty input (should not crash)
      inputHandler('', { delete: true });
      inputHandler('', { delete: true });

      // Should still be able to type after
      inputHandler('o', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });

      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('ok');
    });
  });

  describe('component lifecycle', () => {
    it('should register input handler on mount', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(useInput).toHaveBeenCalled();
      expect(inputHandler).toBeDefined();
    });

    it('should handle prop changes', () => {
      const { rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const newOnSubmit = vi.fn();
      const newOnCancel = vi.fn();

      rerender(<Login onSubmit={newOnSubmit} onCancel={newOnCancel} />);

      // Type and submit with new handlers
      inputHandler('n', { meta: false, ctrl: false });
      inputHandler('e', { meta: false, ctrl: false });
      inputHandler('w', { meta: false, ctrl: false });
      inputHandler('', { return: true });

      expect(newOnSubmit).toHaveBeenCalledWith('new');
      expect(mockOnSubmit).not.toHaveBeenCalledWith('new');
    });

    it('should handle multiple re-renders', () => {
      const { rerender } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Multiple re-renders shouldn't break the component
      for (let i = 0; i < 5; i++) {
        rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      }

      // Should still work after re-renders
      inputHandler('t', { meta: false, ctrl: false });
      inputHandler('e', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('t', { meta: false, ctrl: false });
      inputHandler('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('test');
    });
  });
});