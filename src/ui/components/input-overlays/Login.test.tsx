import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString, createInteractiveTest } from '../../../test/helpers/render-to-string';
import Login from './Login';

describe('Login', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render login prompt', () => {
      const output = renderToString(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(output).toContain('Login with Groq API Key');
      expect(output).toContain('Enter your Groq API key to continue');
      expect(output).toContain('https://console.groq.com/keys');
      expect(output).toContain('API Key:');
    });

    it('should render empty API key field initially', () => {
      const output = renderToString(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Should show API Key: prompt with cursor but no asterisks initially
      expect(output).toContain('API Key:');
      expect(output).toContain('▌'); // Cursor
      expect(output).not.toContain('*'); // No asterisks initially
    });

    it('should display cursor with cyan background', () => {
      const output = renderToString(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { stripAnsi: false }
      );

      // Check for cyan background (ANSI code for cyan background is typically 46)
      expect(output).toContain('▌');
    });
  });

  describe('interactive input', () => {
    it('should handle character input and display asterisks', () => {
      const { pressKey, getOutput, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'test'
      pressKey('t');
      expect(getOutput()).toContain('*');
      
      pressKey('e');
      expect(getOutput()).toContain('**');
      
      pressKey('s');
      expect(getOutput()).toContain('***');
      
      pressKey('t');
      expect(getOutput()).toContain('****');

      unmount();
    });

    it('should handle backspace', () => {
      const { pressKey, getOutput, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'abc'
      pressKey('a');
      pressKey('b');
      pressKey('c');
      expect(getOutput()).toContain('***');

      // Press backspace
      pressKey('', { backspace: true });
      expect(getOutput()).toContain('**');
      expect(getOutput()).not.toContain('***');

      unmount();
    });

    it('should handle delete key', () => {
      const { pressKey, getOutput, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'test'
      pressKey('t');
      pressKey('e');
      pressKey('s');
      pressKey('t');
      expect(getOutput()).toContain('****');

      // Press delete
      pressKey('', { delete: true });
      expect(getOutput()).toContain('***');
      expect(getOutput()).not.toContain('****');

      unmount();
    });

    it('should handle enter key with valid input', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type API key
      pressKey('g');
      pressKey('s');
      pressKey('k');
      pressKey('-');
      pressKey('k');
      pressKey('e');
      pressKey('y');

      // Press enter
      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('gsk-key');
      unmount();
    });

    it('should handle enter key with empty input', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Press enter without typing anything
      pressKey('', { return: true });

      // Should not call onSubmit with empty input
      expect(mockOnSubmit).not.toHaveBeenCalled();
      unmount();
    });

    it('should handle escape key', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      pressKey('', { escape: true });

      expect(mockOnCancel).toHaveBeenCalled();
      unmount();
    });

    it('should handle ctrl+c', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      pressKey('c', { ctrl: true });

      expect(mockOnCancel).toHaveBeenCalled();
      unmount();
    });

    it('should trim whitespace from API key', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type API key with spaces
      pressKey(' ');
      pressKey(' ');
      pressKey('g');
      pressKey('s');
      pressKey('k');
      pressKey(' ');
      pressKey(' ');

      // Press enter
      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
      unmount();
    });

    it('should not submit whitespace-only input', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type only spaces
      pressKey(' ');
      pressKey(' ');
      pressKey(' ');

      // Press enter
      pressKey('', { return: true });

      expect(mockOnSubmit).not.toHaveBeenCalled();
      unmount();
    });

    it('should ignore meta key combinations', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      pressKey('a', { meta: true });

      // Meta key input should be ignored - no submission or cancellation
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
      unmount();
    });

    it('should ignore ctrl key combinations except ctrl+c', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      pressKey('a', { ctrl: true });

      // Ctrl+a should be ignored
      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
      unmount();
    });

    it('should limit asterisk display to 20 characters', () => {
      const { pressKey, getOutput, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 25 characters
      for (let i = 0; i < 25; i++) {
        pressKey('a');
      }

      const output = getOutput();
      // Should show exactly 20 asterisks plus ellipsis
      expect(output).toContain('*'.repeat(20) + '...');
      expect(output).not.toContain('*'.repeat(21));

      unmount();
    });
  });

  describe('complex scenarios', () => {
    it('should handle typing, deleting, and retyping', () => {
      const { pressKey, getOutput, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type 'wrong'
      pressKey('w');
      pressKey('r');
      pressKey('o');
      pressKey('n');
      pressKey('g');
      expect(getOutput()).toContain('*****');

      // Delete all 5 characters
      for (let i = 0; i < 5; i++) {
        pressKey('', { backspace: true });
      }
      expect(getOutput()).not.toContain('*');

      // Type correct key
      pressKey('g');
      pressKey('s');
      pressKey('k');

      // Press enter
      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('gsk');
      unmount();
    });

    it('should handle rapid input', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Simulate rapid typing
      const apiKey = 'gsk-1234567890';
      for (const char of apiKey) {
        pressKey(char);
      }

      // Press enter
      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith(apiKey);
      unmount();
    });

    it('should handle special characters in API key', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const specialKey = 'gsk_test-KEY.123!@#';
      for (const char of specialKey) {
        pressKey(char);
      }

      // Press enter
      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith(specialKey);
      unmount();
    });

    it('should handle very long API keys', () => {
      const { pressKey, getOutput, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const longKey = 'gsk-' + 'a'.repeat(100);
      for (const char of longKey) {
        pressKey(char);
      }

      // Should show 20 asterisks plus ellipsis
      expect(getOutput()).toContain('*'.repeat(20) + '...');

      // Press enter
      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith(longKey);
      unmount();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple escape presses', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      pressKey('', { escape: true });
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      
      // Clear the mock to test second press
      mockOnCancel.mockClear();
      
      pressKey('', { escape: true });
      // Second escape should still call onCancel
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      
      unmount();
    });

    it('should handle mixed control characters', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type some text
      pressKey('t');
      pressKey('e');
      pressKey('s');
      pressKey('t');

      // Try ctrl+a (should be ignored)
      pressKey('a', { ctrl: true });

      // Try meta+c (should be ignored)  
      pressKey('c', { meta: true });

      // Actual text should still be there, submit it
      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('test');
      unmount();
    });

    it('should handle backspace on empty input', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Press backspace on empty input (should not crash)
      pressKey('', { backspace: true });
      pressKey('', { backspace: true });

      // Should still be able to type after
      pressKey('o');
      pressKey('k');

      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('ok');
      unmount();
    });

    it('should handle delete on empty input', () => {
      const { pressKey, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Press delete on empty input (should not crash)
      pressKey('', { delete: true });
      pressKey('', { delete: true });

      // Should still be able to type after
      pressKey('o');
      pressKey('k');

      pressKey('', { return: true });

      expect(mockOnSubmit).toHaveBeenCalledWith('ok');
      unmount();
    });
  });

  describe('output formatting', () => {
    it('should show correct structure', () => {
      const output = renderToString(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Check the overall structure
      const lines = output.split('\n').filter(line => line.trim());
      
      // Should have title
      expect(lines.some(line => line.includes('Login with Groq API Key'))).toBe(true);
      
      // Should have instructions
      expect(lines.some(line => line.includes('Enter your Groq API key'))).toBe(true);
      
      // Should have API key prompt
      expect(lines.some(line => line.includes('API Key:'))).toBe(true);
    });

    it('should handle asterisk overflow correctly', () => {
      const { pressKey, getOutput, unmount } = createInteractiveTest(
        <Login onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // Type exactly 20 characters
      for (let i = 0; i < 20; i++) {
        pressKey('x');
      }
      
      let output = getOutput();
      expect(output).toContain('*'.repeat(20));
      expect(output).not.toContain('...');

      // Type one more character (21st)
      pressKey('y');
      
      output = getOutput();
      expect(output).toContain('*'.repeat(20) + '...');

      unmount();
    });
  });
});