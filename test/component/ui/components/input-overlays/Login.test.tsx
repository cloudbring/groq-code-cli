import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as inkModule from 'ink';
import Login from '@src/ui/components/input-overlays/Login';

// Create a mock for useInput
const mockUseInput = vi.fn();
let inputHandler: any;

// Mock ink module
vi.mock('ink', () => ({
  Box: ({ children, ...props }: any) => <div data-testid="box" {...props}>{children}</div>,
  Text: ({ children, color, bold, underline, backgroundColor }: any) => (
    <span 
      data-testid="text" 
      data-color={color}
      data-bold={bold}
      data-underline={underline}
      data-bg={backgroundColor}
    >
      {children}
    </span>
  ),
  useInput: (handler: any) => {
    inputHandler = handler;
    mockUseInput(handler);
  }
}));

describe('Login Component - Simple Tests', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    inputHandler = undefined;
  });

  describe('rendering', () => {
    it('should render login prompt', () => {
      const { getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(getByText('Login with Groq API Key')).toBeTruthy();
    });

    it('should render instructions', () => {
      const { getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(getByText(/Enter your Groq API key to continue/)).toBeTruthy();
      expect(getByText('https://console.groq.com/keys')).toBeTruthy();
    });

    it('should render API key prompt', () => {
      const { getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(getByText('API Key:')).toBeTruthy();
    });

    it('should render cursor', () => {
      const { getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(getByText('▌')).toBeTruthy();
    });

    it('should apply cyan color to title', () => {
      const { getAllByTestId } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const texts = getAllByTestId('text');
      const titleText = texts.find(el => 
        el.textContent === 'Login with Groq API Key' &&
        el.getAttribute('data-color') === 'cyan' &&
        el.getAttribute('data-bold') === 'true'
      );
      
      expect(titleText).toBeTruthy();
    });

    it('should apply gray color to instructions', () => {
      const { getAllByTestId } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const texts = getAllByTestId('text');
      const instructionText = texts.find(el => 
        el.textContent?.includes('Enter your Groq API key') &&
        el.getAttribute('data-color') === 'gray'
      );
      
      expect(instructionText).toBeTruthy();
    });

    it('should underline the URL', () => {
      const { getAllByTestId } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const texts = getAllByTestId('text');
      const urlText = texts.find(el => 
        el.textContent === 'https://console.groq.com/keys' &&
        el.getAttribute('data-underline') === 'true'
      );
      
      expect(urlText).toBeTruthy();
    });

    it('should apply cyan background to cursor', () => {
      const { getAllByTestId } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const texts = getAllByTestId('text');
      const cursorText = texts.find(el => 
        el.textContent === '▌' &&
        el.getAttribute('data-bg') === 'cyan'
      );
      
      expect(cursorText).toBeTruthy();
    });
  });

  describe('input handling', () => {
    it.skip('should handle character input', () => {
      const { rerender, getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Simulate typing 'test'
      inputHandler('t', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      inputHandler('e', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      inputHandler('s', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      inputHandler('t', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Should show 4 asterisks
      expect(getByText('****')).toBeTruthy();
    });

    it('should handle backspace', () => {
      const { rerender, getByText, queryByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'abc'
      inputHandler('a', { meta: false, ctrl: false });
      inputHandler('b', { meta: false, ctrl: false });
      inputHandler('c', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(getByText('***')).toBeTruthy();
      
      // Press backspace
      inputHandler('', { backspace: true });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(getByText('**')).toBeTruthy();
      expect(queryByText('***')).toBeFalsy();
    });

    it('should handle delete key', () => {
      const { rerender, getByText, queryByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'test'
      inputHandler('t', { meta: false, ctrl: false });
      inputHandler('e', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('t', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(getByText('****')).toBeTruthy();
      
      // Press delete
      inputHandler('', { delete: true });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(getByText('***')).toBeTruthy();
      expect(queryByText('****')).toBeFalsy();
    });

    it.skip('should handle enter key with valid input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Type API key
      inputHandler('g', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });
      
      // Press enter
      inputHandler('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
    });

    it('should handle enter key with empty input', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Press enter without typing anything
      inputHandler('', { return: true });
      
      // Should not call onSubmit
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

    it.skip('should trim whitespace from API key', () => {
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

      inputHandler('a', { meta: true });
      
      // Meta key input should be ignored
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should ignore ctrl key combinations except ctrl+c', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      inputHandler('a', { ctrl: true });
      
      // Ctrl+a should be ignored
      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it.skip('should limit asterisk display to 20 characters', () => {
      const { rerender, getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 25 characters
      for (let i = 0; i < 25; i++) {
        inputHandler('a', { meta: false, ctrl: false });
      }
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Should show exactly 20 asterisks plus ellipsis
      expect(getByText('*'.repeat(20))).toBeTruthy();
      expect(getByText('...')).toBeTruthy();
    });
  });

  describe('complex scenarios', () => {
    it.skip('should handle typing, deleting, and retyping', () => {
      const { rerender, getByText, queryByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'wrong'
      inputHandler('w', { meta: false, ctrl: false });
      inputHandler('r', { meta: false, ctrl: false });
      inputHandler('o', { meta: false, ctrl: false });
      inputHandler('n', { meta: false, ctrl: false });
      inputHandler('g', { meta: false, ctrl: false });
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(getByText('*****')).toBeTruthy();
      
      // Delete all 5 characters
      for (let i = 0; i < 5; i++) {
        inputHandler('', { backspace: true });
      }
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(queryByText('*')).toBeFalsy();
      
      // Type correct key
      inputHandler('g', { meta: false, ctrl: false });
      inputHandler('s', { meta: false, ctrl: false });
      inputHandler('k', { meta: false, ctrl: false });
      
      // Press enter
      inputHandler('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
    });

    it.skip('should handle rapid input', () => {
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

    it.skip('should handle special characters in API key', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const specialKey = 'gsk_test-KEY.123!@#';
      for (const char of specialKey) {
        inputHandler(char, { meta: false, ctrl: false });
      }
      
      // Press enter
      inputHandler('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith(specialKey);
    });

    it.skip('should handle very long API keys', () => {
      const { rerender, getByText } = render(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const longKey = 'gsk-' + 'a'.repeat(100);
      for (const char of longKey) {
        inputHandler(char, { meta: false, ctrl: false });
      }
      rerender(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      // Should show 20 asterisks plus ellipsis
      expect(getByText('*'.repeat(20))).toBeTruthy();
      expect(getByText('...')).toBeTruthy();
      
      // Press enter
      inputHandler('', { return: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith(longKey);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple escape presses', () => {
      render(<Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      inputHandler('', { escape: true });
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      
      // Clear the mock
      mockOnCancel.mockClear();
      
      inputHandler('', { escape: true });
      // Second escape should still call onCancel
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it.skip('should handle mixed control characters', () => {
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

    it.skip('should handle backspace on empty input', () => {
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

    it.skip('should handle delete on empty input', () => {
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
});